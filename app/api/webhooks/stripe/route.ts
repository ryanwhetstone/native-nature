import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/db";
import { donations, conservationProjects, stripeTransactions } from "@/db/schema";
import { eq } from "drizzle-orm";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error("STRIPE_WEBHOOK_SECRET is not set");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-12-15.clover",
});

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "No signature found" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  // Handle the event
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        const projectId = parseInt(session.metadata?.projectId || "0");
        const userId = session.metadata?.userId;
        const amount = parseInt(session.metadata?.amount || "0");
        const projectAmount = parseInt(session.metadata?.projectAmount || "0");
        const siteTip = parseInt(session.metadata?.siteTip || "0");
        const coversFees = session.metadata?.coversFees === 'true';

        if (!projectId || !amount || !projectAmount) {
          console.error("Missing metadata in checkout session");
          return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
        }

        // Get project and recipient info
        const project = await db.query.conservationProjects.findFirst({
          where: eq(conservationProjects.id, projectId),
          with: {
            user: true,
          },
        });

        if (!project) {
          console.error("Project not found:", projectId);
          return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Create donation record
        const [donation] = await db.insert(donations).values({
          projectId,
          userId: userId || null,
          amount,
          projectAmount,
          siteTip,
          coversFees,
          stripeSessionId: session.id,
          stripePaymentIntentId: session.payment_intent as string,
          status: "completed",
          completedAt: new Date(),
        }).returning();

        // Retrieve the charge and balance transaction for exact fee information
        let stripeFeeActual = null;
        let balanceTransaction = null;
        let chargeDetails = null;

        try {
          if (session.payment_intent) {
            const paymentIntent = await stripe.paymentIntents.retrieve(
              session.payment_intent as string,
              { expand: ['latest_charge'] }
            );

            const charge = paymentIntent.latest_charge as Stripe.Charge;
            console.log("Charge retrieved:", charge?.id, "Balance TX:", charge?.balance_transaction);
            
            if (charge) {
              chargeDetails = {
                id: charge.id,
                amount: charge.amount,
                currency: charge.currency,
                status: charge.status,
                payment_method: charge.payment_method,
              };

              if (charge.balance_transaction) {
                const balTxId = typeof charge.balance_transaction === 'string' 
                  ? charge.balance_transaction 
                  : charge.balance_transaction.id;
                  
                const balTx = await stripe.balanceTransactions.retrieve(balTxId);
                balanceTransaction = balTx;
                stripeFeeActual = balTx.fee; // Actual Stripe fee in cents
                console.log("Balance transaction retrieved:", balTx.id, "Fee:", balTx.fee);
              } else {
                console.log("No balance_transaction on charge yet");
              }

              // Get payment method details
              if (charge.payment_method_details?.card) {
                const card = charge.payment_method_details.card;
                
                // Create Stripe transaction record
                await db.insert(stripeTransactions).values({
                  donationId: donation.id,
                  projectId,
                  donorUserId: userId || null,
                  recipientUserId: project.userId,
                  stripeChargeId: charge.id,
                  stripePaymentIntentId: session.payment_intent as string,
                  stripeSessionId: session.id,
                  amount,
                  projectAmount,
                  siteTip,
                  stripeFeeActual,
                  netAmount: balanceTransaction ? balanceTransaction.net : null,
                  currency: charge.currency,
                  status: charge.status,
                  paymentMethod: charge.payment_method_details.type,
                  cardBrand: card.brand,
                  cardLast4: card.last4,
                  stripeEventType: event.type,
                  stripeEventData: event.data.object as any,
                  balanceTransaction: balanceTransaction as any,
                  processedAt: new Date(),
                });
              }
            }
          }
        } catch (error) {
          console.error("Error retrieving Stripe details:", error);
          // Continue anyway - we still have the donation record
        }

        // Update project's current funding
        await db
          .update(conservationProjects)
          .set({
            currentFunding: (project.currentFunding || 0) + projectAmount,
            updatedAt: new Date(),
          })
          .where(eq(conservationProjects.id, projectId));

        console.log("Donation processed:", donation.id, "Actual Stripe fee:", stripeFeeActual);
        break;
      }

      case "charge.succeeded": {
        const charge = event.data.object as Stripe.Charge;
        console.log("Charge succeeded event:", charge.id);

        // Check if we already have a transaction record for this charge
        const existingTx = await db.query.stripeTransactions.findFirst({
          where: eq(stripeTransactions.stripeChargeId, charge.id),
        });

        if (existingTx) {
          console.log("Transaction already exists, updating with balance transaction data");
          
          // Update with balance transaction data if we have it now
          if (charge.balance_transaction) {
            const balTxId = typeof charge.balance_transaction === 'string' 
              ? charge.balance_transaction 
              : charge.balance_transaction.id;
              
            const balTx = await stripe.balanceTransactions.retrieve(balTxId);
            
            await db
              .update(stripeTransactions)
              .set({
                stripeFeeActual: balTx.fee,
                netAmount: balTx.net,
                balanceTransaction: balTx as any,
              })
              .where(eq(stripeTransactions.stripeChargeId, charge.id));
            
            console.log("Updated transaction with fee:", balTx.fee);
          }
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.error("Payment failed:", paymentIntent.id);
        
        // Update donation status if it exists
        await db
          .update(donations)
          .set({ status: "failed" })
          .where(eq(donations.stripePaymentIntentId, paymentIntent.id));
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

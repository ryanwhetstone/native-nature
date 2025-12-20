import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/db";
import { donations, conservationProjects } from "@/db/schema";
import { eq } from "drizzle-orm";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error("STRIPE_WEBHOOK_SECRET is not set");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia",
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

        // Update project's current funding with the project amount (not total)
        const [project] = await db
          .select()
          .from(conservationProjects)
          .where(eq(conservationProjects.id, projectId));

        if (project) {
          await db
            .update(conservationProjects)
            .set({
              currentFunding: (project.currentFunding || 0) + projectAmount,
              updatedAt: new Date(),
            })
            .where(eq(conservationProjects.id, projectId));
        }

        console.log("Donation processed:", donation.id);
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

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/auth";
import { db } from "@/db";
import { conservationProjects } from "@/db/schema";
import { eq } from "drizzle-orm";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-12-15.clover",
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { projectId, amount, projectAmount, siteTip, coversFees } = await request.json();

    if (!projectId || !amount || amount < 100) {
      return NextResponse.json(
        { error: "Invalid project ID or amount (minimum $1.00)" },
        { status: 400 }
      );
    }

    if (!projectAmount) {
      return NextResponse.json(
        { error: "Project amount is required" },
        { status: 400 }
      );
    }

    // Fetch project to verify it exists
    const project = await db.query.conservationProjects.findFirst({
      where: eq(conservationProjects.id, projectId),
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Check if project is funded (no longer accepting donations)
    if (project.status === 'funded') {
      return NextResponse.json(
        { error: "This project has reached its funding goal and is no longer accepting donations" },
        { status: 400 }
      );
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Donation to ${project.title}`,
              description: `${coversFees ? 'Includes transaction fees. ' : ''}${siteTip > 0 ? `Includes $${(siteTip / 100).toFixed(2)} tip to support Native Nature. ` : ''}${project.description.substring(0, 150)}`,
            },
            unit_amount: amount, // total amount in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/conservation-project/${projectId}-${project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/conservation-project/${projectId}-${project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}?payment=cancelled`,
      metadata: {
        projectId: projectId.toString(),
        userId: session.user.id,
        amount: amount.toString(),
        projectAmount: projectAmount.toString(),
        siteTip: (siteTip || 0).toString(),
        coversFees: coversFees ? 'true' : 'false',
      },
    });

    return NextResponse.json({ 
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

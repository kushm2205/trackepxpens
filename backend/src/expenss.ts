import * as dotenv from "dotenv";
import express from "express";
import cors from "cors";
import * as admin from "firebase-admin";
import Stripe from "stripe";

// Initialize dotenv
dotenv.config();

// Initialize Express
const app = express();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-08-16",
});

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Interfaces
interface RequestWithUser extends express.Request {
  user?: admin.auth.DecodedIdToken;
}

interface Plan {
  priceId: string;
  amount: number;
  interval: string;
}

interface Plans {
  [key: string]: Plan;
}

// Verify Firebase token middleware
const verifyFirebaseToken = async (
  req: RequestWithUser,
  res: express.Response,
  next: express.NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Error verifying token:", error);
    return res.status(401).json({ error: "Unauthorized" });
  }
};

// Routes
app.post(
  "/create-subscription",
  verifyFirebaseToken,
  async (req: RequestWithUser, res: express.Response) => {
    const { planId, userId, email } = req.body;

    try {
      const plans: Plans = {
        monthly: {
          priceId: process.env.STRIPE_MONTHLY_PRICE_ID!,
          amount: 499,
          interval: "month",
        },
        yearly: {
          priceId: process.env.STRIPE_YEARLY_PRICE_ID!,
          amount: 4999,
          interval: "year",
        },
      };

      const selectedPlan = plans[planId];
      if (!selectedPlan) {
        return res.status(400).json({ error: "Invalid plan ID" });
      }

      // Check if user already has a Stripe customer ID
      const userDoc = await admin
        .firestore()
        .collection("users")
        .doc(userId)
        .get();
      const userData = userDoc.data() || {};

      let customerId = userData.stripeCustomerId;

      // Create a new Stripe customer if needed
      if (!customerId) {
        const customer = await stripe.customers.create({
          email,
          metadata: { userId },
        });

        customerId = customer.id;

        // Save the customer ID to Firestore
        await admin.firestore().collection("users").doc(userId).set(
          {
            stripeCustomerId: customerId,
          },
          { merge: true }
        );
      }

      // Create a Stripe Checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: selectedPlan.priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        customer: customerId,
        success_url: `${process.env.APP_DEEP_LINK}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.APP_DEEP_LINK}/canceled`,
        metadata: {
          userId,
          planId,
        },
      });

      res.json({ paymentIntent: session.client_secret });
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ error: "Failed to create subscription" });
    }
  }
);

// Stripe webhook handler
app.post(
  "/stripe-webhook",
  express.raw({ type: "application/json" }),
  async (req: express.Request, res: express.Response) => {
    const sig = req.headers["stripe-signature"] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error("Webhook error:", err);
      return res.status(400).send(`Webhook Error: ${err}`);
    }

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      case "invoice.paid":
        await handleInvoicePaid(event.data.object);
        break;
      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  }
);

// Webhook handlers
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  const userId = session.metadata?.userId;
  const planId = session.metadata?.planId;

  if (!userId || !planId || !session.subscription) {
    console.error("Missing required metadata in session");
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  );

  await admin
    .firestore()
    .collection("users")
    .doc(userId)
    .set(
      {
        subscription: {
          status: subscription.status,
          planId,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          subscriptionId: subscription.id,
        },
      },
      { merge: true }
    );
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const customerId = invoice.customer as string;

  const userQuery = await admin
    .firestore()
    .collection("users")
    .where("stripeCustomerId", "==", customerId)
    .limit(1)
    .get();

  if (userQuery.empty) {
    console.error("User not found for customer:", customerId);
    return;
  }

  const userDoc = userQuery.docs[0];

  await userDoc.ref.set(
    {
      subscription: {
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    },
    { merge: true }
  );
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  const userQuery = await admin
    .firestore()
    .collection("users")
    .where("stripeCustomerId", "==", customerId)
    .limit(1)
    .get();

  if (userQuery.empty) {
    console.error("User not found for customer:", customerId);
    return;
  }

  const userDoc = userQuery.docs[0];

  await userDoc.ref.set(
    {
      "subscription.status": "past_due",
    },
    { merge: true }
  );
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const userQuery = await admin
    .firestore()
    .collection("users")
    .where("stripeCustomerId", "==", customerId)
    .limit(1)
    .get();

  if (userQuery.empty) {
    console.error("User not found for customer:", customerId);
    return;
  }

  const userDoc = userQuery.docs[0];

  await userDoc.ref.set(
    {
      "subscription.status": "canceled",
    },
    { merge: true }
  );
}

// Export the app
export default app;

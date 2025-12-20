# Stripe Payment Integration

This project uses Stripe for processing donations to conservation projects.

## Setup Instructions

### 1. Create a Stripe Account

1. Go to [https://stripe.com](https://stripe.com) and sign up
2. Complete the account verification process
3. Switch to Test mode (toggle in top right)

### 2. Get API Keys

1. Go to [Developers → API Keys](https://dashboard.stripe.com/test/apikeys)
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)
4. Add to your `.env.local`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

### 3. Set Up Webhooks (Local Development)

For local testing, use the Stripe CLI:

1. Install Stripe CLI: [https://stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
2. Login to Stripe:
   ```bash
   stripe login
   ```
3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
4. Copy the webhook signing secret (starts with `whsec_`) and add to `.env.local`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### 4. Set Up Webhooks (Production)

1. Go to [Developers → Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click "Add endpoint"
3. Enter your endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen for:
   - `checkout.session.completed`
   - `payment_intent.payment_failed`
5. Click "Add endpoint"
6. Copy the "Signing secret" and add to your production environment variables

### 5. Run Database Migration

```bash
npm run db:push
```

This will create the `donations` table.

## Testing Payments

### Test Card Numbers

Stripe provides test card numbers that simulate different scenarios:

- **Success**: `4242 4242 4242 4242`
- **Declined**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0027 6000 3184`

Use any future expiration date, any 3-digit CVC, and any zip code.

### Test Flow

1. Navigate to a conservation project page
2. Click "Donate Now"
3. Select an amount
4. Click "Continue to Payment"
5. Enter test card details
6. Complete payment
7. You'll be redirected back to the project page
8. The funding progress should update automatically (via webhook)

## How It Works

### Payment Flow

1. User clicks "Donate Now" on a project page
2. User selects donation amount in modal
3. Frontend calls `/api/checkout` with project ID and amount
4. API creates a Stripe Checkout session
5. User is redirected to Stripe's hosted checkout page
6. User enters payment details and completes payment
7. User is redirected back to project page with success/cancel status
8. Stripe sends webhook to `/api/webhooks/stripe`
9. Webhook handler creates donation record and updates project funding

### Database Schema

**donations** table:
- `id`: Primary key
- `projectId`: Foreign key to conservation_projects
- `userId`: Foreign key to users (nullable for anonymous donations)
- `amount`: Donation amount in cents
- `stripeSessionId`: Stripe checkout session ID
- `stripePaymentIntentId`: Stripe payment intent ID
- `status`: pending, completed, failed, refunded
- `donorName`: Optional donor name (for anonymous donations)
- `donorEmail`: Optional donor email (for anonymous donations)
- `message`: Optional message from donor
- `createdAt`: Timestamp of donation creation
- `completedAt`: Timestamp when payment completed

### Security

- All payments are processed securely by Stripe
- Sensitive card details never touch our servers
- Webhook signatures are verified to prevent tampering
- User authentication required to create checkout sessions
- All amounts are in cents to avoid floating-point errors

## Monitoring

### View Payments in Stripe Dashboard

1. Go to [Payments](https://dashboard.stripe.com/test/payments)
2. You'll see all test payments
3. Click on a payment to see details

### View Webhooks

1. Go to [Developers → Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click on your webhook endpoint
3. View webhook delivery attempts and their status

## Going Live

Before accepting real payments:

1. Complete Stripe account verification
2. Switch from Test mode to Live mode in Stripe Dashboard
3. Generate new Live API keys
4. Update production environment variables with Live keys
5. Set up production webhook endpoint
6. Test thoroughly with small amounts

## Troubleshooting

### Webhook Not Receiving Events

- Verify webhook URL is publicly accessible
- Check webhook signing secret is correct
- View webhook logs in Stripe Dashboard
- For local dev, ensure Stripe CLI is running

### Payment Not Updating Funding

- Check webhook endpoint logs
- Verify donation was created in database
- Check project's currentFunding field was updated
- Look for errors in application logs

### Checkout Session Fails to Create

- Verify Stripe secret key is correct
- Check amount is at least 100 cents ($1.00)
- Ensure project exists in database
- Check API route logs for errors

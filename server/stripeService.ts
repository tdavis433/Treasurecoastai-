import { getUncachableStripeClient } from './stripeClient';
import { db } from './storage';
import { sql } from 'drizzle-orm';

export class StripeService {
  async createCustomer(email: string, clientId: string, businessName: string) {
    const stripe = await getUncachableStripeClient();
    if (!stripe) throw new Error('Stripe not configured');
    return await stripe.customers.create({
      email,
      name: businessName,
      metadata: { clientId },
    });
  }

  async createCheckoutSession(
    customerId: string, 
    priceId: string, 
    clientId: string,
    successUrl: string, 
    cancelUrl: string
  ) {
    const stripe = await getUncachableStripeClient();
    if (!stripe) throw new Error('Stripe not configured');
    return await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        metadata: { clientId },
      },
    });
  }

  async createCustomerPortalSession(customerId: string, returnUrl: string) {
    const stripe = await getUncachableStripeClient();
    if (!stripe) throw new Error('Stripe not configured');
    return await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  async getProduct(productId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.products WHERE id = ${productId}`
    );
    return result.rows[0] || null;
  }

  async listProducts(active = true, limit = 20, offset = 0) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.products WHERE active = ${active} LIMIT ${limit} OFFSET ${offset}`
    );
    return result.rows;
  }

  async listProductsWithPrices(active = true, limit = 20, offset = 0) {
    const result = await db.execute(
      sql`
        WITH paginated_products AS (
          SELECT id, name, description, metadata, active
          FROM stripe.products
          WHERE active = ${active}
          ORDER BY id
          LIMIT ${limit} OFFSET ${offset}
        )
        SELECT 
          p.id as product_id,
          p.name as product_name,
          p.description as product_description,
          p.active as product_active,
          p.metadata as product_metadata,
          pr.id as price_id,
          pr.unit_amount,
          pr.currency,
          pr.recurring,
          pr.active as price_active,
          pr.metadata as price_metadata
        FROM paginated_products p
        LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
        ORDER BY p.id, pr.unit_amount
      `
    );
    return result.rows;
  }

  async getPrice(priceId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.prices WHERE id = ${priceId}`
    );
    return result.rows[0] || null;
  }

  async listPrices(active = true, limit = 20, offset = 0) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.prices WHERE active = ${active} LIMIT ${limit} OFFSET ${offset}`
    );
    return result.rows;
  }

  async getPricesForProduct(productId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.prices WHERE product = ${productId} AND active = true`
    );
    return result.rows;
  }

  async getSubscription(subscriptionId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.subscriptions WHERE id = ${subscriptionId}`
    );
    return result.rows[0] || null;
  }

  async getCustomerByClientId(clientId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.customers WHERE metadata->>'clientId' = ${clientId} LIMIT 1`
    );
    return result.rows[0] || null;
  }

  async getSubscriptionByClientId(clientId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.subscriptions WHERE metadata->>'clientId' = ${clientId} AND status = 'active' LIMIT 1`
    );
    return result.rows[0] || null;
  }

  async getBillingOverview() {
    const subscriptionsResult = await db.execute(
      sql`
        WITH subscription_totals AS (
          SELECT 
            s.id,
            s.status,
            s.metadata,
            s.current_period_start,
            s.current_period_end,
            s.canceled_at,
            s.customer,
            COALESCE(SUM(p.unit_amount * COALESCE(si.quantity, 1)), 0) as total_amount,
            MIN(p.currency) as currency,
            (array_agg(p.recurring) FILTER (WHERE p.recurring IS NOT NULL))[1] as recurring,
            STRING_AGG(DISTINCT pr.name, ', ') as product_names
          FROM stripe.subscriptions s
          LEFT JOIN stripe.subscription_items si ON si.subscription = s.id
          LEFT JOIN stripe.prices p ON si.price = p.id
          LEFT JOIN stripe.products pr ON p.product = pr.id
          GROUP BY s.id, s.status, s.metadata, s.current_period_start, s.current_period_end, s.canceled_at, s.customer
        )
        SELECT 
          st.*,
          c.email as customer_email,
          c.name as customer_name,
          c.metadata as customer_metadata
        FROM subscription_totals st
        LEFT JOIN stripe.customers c ON st.customer = c.id
        ORDER BY st.current_period_start DESC
      `
    );

    const subscriptions = subscriptionsResult.rows as any[];

    const activeSubscriptions = subscriptions.filter(s => s.status === 'active' || s.status === 'trialing');
    const pastDueSubscriptions = subscriptions.filter(s => s.status === 'past_due');
    const canceledSubscriptions = subscriptions.filter(s => s.status === 'canceled');
    const incompleteSubscriptions = subscriptions.filter(s => s.status === 'incomplete' || s.status === 'incomplete_expired');

    const mrr = activeSubscriptions.reduce((total, sub) => {
      if (sub.total_amount && sub.recurring) {
        const recurring = typeof sub.recurring === 'string' ? JSON.parse(sub.recurring) : sub.recurring;
        const interval = recurring?.interval || 'month';
        const intervalCount = recurring?.interval_count || 1;
        
        let monthlyAmount = Number(sub.total_amount);
        if (interval === 'year') {
          monthlyAmount = monthlyAmount / 12;
        } else if (interval === 'week') {
          monthlyAmount = monthlyAmount * 4.33;
        }
        
        return total + (monthlyAmount / intervalCount);
      }
      return total;
    }, 0);

    return {
      mrr: Math.round(mrr) / 100,
      activeCount: activeSubscriptions.length,
      pastDueCount: pastDueSubscriptions.length,
      canceledCount: canceledSubscriptions.length,
      incompleteCount: incompleteSubscriptions.length,
      totalSubscriptions: subscriptions.length,
      subscriptions: subscriptions.map(s => ({
        id: s.id,
        status: s.status,
        clientId: s.metadata?.clientId || s.customer_metadata?.clientId || null,
        customerName: s.customer_name,
        customerEmail: s.customer_email,
        productName: s.product_names,
        amount: s.total_amount ? Number(s.total_amount) / 100 : 0,
        currency: s.currency || 'usd',
        currentPeriodStart: s.current_period_start,
        currentPeriodEnd: s.current_period_end,
        canceledAt: s.canceled_at,
      })),
    };
  }

  async getRecentInvoices(limit = 10) {
    const result = await db.execute(
      sql`
        SELECT 
          i.id,
          i.status,
          i.amount_due,
          i.amount_paid,
          i.currency,
          i.created,
          i.due_date,
          i.paid,
          c.email as customer_email,
          c.name as customer_name,
          c.metadata as customer_metadata
        FROM stripe.invoices i
        LEFT JOIN stripe.customers c ON i.customer = c.id
        ORDER BY i.created DESC
        LIMIT ${limit}
      `
    );
    
    return result.rows.map((row: any) => ({
      id: row.id,
      status: row.status,
      amountDue: row.amount_due ? row.amount_due / 100 : 0,
      amountPaid: row.amount_paid ? row.amount_paid / 100 : 0,
      currency: row.currency || 'usd',
      created: row.created,
      dueDate: row.due_date,
      paid: row.paid,
      customerEmail: row.customer_email,
      customerName: row.customer_name,
      clientId: row.customer_metadata?.clientId || null,
    }));
  }
}

export const stripeService = new StripeService();

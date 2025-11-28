import { getStripeSync } from './stripeClient';
import * as botConfig from './botConfig';

const ACTIVE_STATUSES = ['active', 'trialing', 'incomplete'];
const PAUSED_STATUSES = ['canceled', 'unpaid', 'past_due', 'incomplete_expired'];

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string, uuid: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    console.log(`Processing webhook with UUID: ${uuid}, payload size: ${payload.length} bytes`);

    const sync = await getStripeSync();
    
    const event = await sync.processWebhook(payload, signature, uuid);
    
    if (event) {
      await WebhookHandlers.handleStripeEvent(event);
    }
  }

  static async handleStripeEvent(event: any): Promise<void> {
    const eventType = event.type;
    const data = event.data?.object;

    console.log(`Processing Stripe event: ${eventType}`);

    switch (eventType) {
      case 'customer.subscription.deleted':
        {
          const clientId = data?.metadata?.clientId;
          if (clientId) {
            console.log(`Subscription deleted for client ${clientId}, pausing service`);
            botConfig.updateClientStatus(clientId, 'paused');
          }
        }
        break;

      case 'customer.subscription.updated':
        {
          const subscriptionStatus = data?.status;
          const clientId = data?.metadata?.clientId;
          
          if (!clientId) {
            console.log(`No clientId in subscription metadata, skipping status update`);
            break;
          }

          if (ACTIVE_STATUSES.includes(subscriptionStatus)) {
            console.log(`Subscription ${subscriptionStatus} for client ${clientId}, keeping/setting active`);
            botConfig.updateClientStatus(clientId, 'active');
          } else if (PAUSED_STATUSES.includes(subscriptionStatus)) {
            console.log(`Subscription ${subscriptionStatus} for client ${clientId}, pausing service`);
            botConfig.updateClientStatus(clientId, 'paused');
          } else {
            console.log(`Subscription status ${subscriptionStatus} for client ${clientId}, no action taken`);
          }
        }
        break;

      case 'invoice.payment_failed':
        {
          const clientId = data?.subscription_details?.metadata?.clientId || data?.metadata?.clientId;
          if (clientId) {
            console.log(`Payment failed for client ${clientId}, pausing service`);
            botConfig.updateClientStatus(clientId, 'paused');
          }
        }
        break;

      case 'invoice.payment_succeeded':
        {
          const clientId = data?.subscription_details?.metadata?.clientId || data?.metadata?.clientId;
          if (clientId) {
            console.log(`Payment succeeded for client ${clientId}, activating service`);
            botConfig.updateClientStatus(clientId, 'active');
          }
        }
        break;

      case 'checkout.session.completed':
        {
          const clientId = data?.metadata?.clientId;
          if (clientId) {
            console.log(`Checkout completed for client ${clientId}, activating service`);
            botConfig.updateClientStatus(clientId, 'active');
          }
        }
        break;

      default:
        break;
    }
  }
}

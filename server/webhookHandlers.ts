import { getStripeSync } from './stripeClient';
import { updateClientStatus } from './botConfig';

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
      case 'customer.subscription.updated':
        if (data?.status === 'canceled' || data?.status === 'unpaid' || data?.status === 'past_due') {
          const clientId = data?.metadata?.clientId;
          if (clientId) {
            console.log(`Pausing client ${clientId} due to subscription status: ${data.status}`);
            updateClientStatus(clientId, 'paused');
          }
        } else if (data?.status === 'active') {
          const clientId = data?.metadata?.clientId;
          if (clientId) {
            console.log(`Activating client ${clientId} due to active subscription`);
            updateClientStatus(clientId, 'active');
          }
        }
        break;

      case 'invoice.payment_failed':
        const subscriptionId = data?.subscription;
        const clientId = data?.subscription_details?.metadata?.clientId || data?.metadata?.clientId;
        if (clientId) {
          console.log(`Payment failed for client ${clientId}, pausing service`);
          updateClientStatus(clientId, 'paused');
        }
        break;

      case 'invoice.payment_succeeded':
        const paidClientId = data?.subscription_details?.metadata?.clientId || data?.metadata?.clientId;
        if (paidClientId) {
          console.log(`Payment succeeded for client ${paidClientId}, activating service`);
          updateClientStatus(paidClientId, 'active');
        }
        break;

      case 'checkout.session.completed':
        console.log('Checkout session completed:', data?.id);
        break;

      default:
        break;
    }
  }
}

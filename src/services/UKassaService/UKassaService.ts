import axios from 'axios';
import { randomUUID } from 'node:crypto';
import { getEnv } from '../../config/envVars.ts';
import { UKassaPaymentWebhook } from './UKassaPaymentWebhook.ts';

export class UKassaService {
  async createPayment({
    price,
    description,
    returnUrl,
    metadata,
  }: {
    price: number;
    description: string;
    returnUrl: string;
    metadata: Record<string, unknown>;
  }): Promise<string> {
    const data = {
      amount: {
        value: (price / 100).toFixed(2),
        currency: 'RUB',
      },
      capture: true,
      confirmation: {
        type: 'redirect',
        return_url: returnUrl,
      },
      description,
      metadata,
    };

    const response = await axios.post('https://api.yookassa.ru/v3/payments', data, {
      headers: {
        'Content-Type': 'application/json',
        'Idempotence-Key': randomUUID(),
      },
      auth: {
        username: getEnv().UKASSA_SHOP_ID,
        password: getEnv().UKASSA_SECRET_KEY,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return response.data.confirmation.confirmation_url as string;
  }

  /**
   * @returns function to unsubscribe from the event
   */
  onPaymentSucceeded(callback: (webhook: UKassaPaymentWebhook) => void): VoidFunction {
    return () => {};
  }
}

export const ukassaService = new UKassaService();

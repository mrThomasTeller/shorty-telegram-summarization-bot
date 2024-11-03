import axios from 'axios';
import { randomUUID } from 'node:crypto';
import { getEnv } from '../../config/envVars';
import { type UKassaPaymentWebhook } from './UKassaPaymentWebhook';
import cors from 'cors';
import express from 'express';
import logger from '../../config/logger';

type Metadata = UKassaPaymentWebhook['object']['metadata'];

export class UKassaPaymentCanceledError extends Error {
  constructor() {
    super('UKassa payment was canceled');
  }
}

export class UKassaService {
  private readonly paymentSucceededCallbacks: ((
    webhook: UKassaPaymentWebhook<NonNullable<Metadata>>
  ) => void)[] = [];

  private webServerStarted = false;

  async createPayment<TMetadata extends Metadata>({
    price,
    description,
    returnUrl,
    metadata,
    paymentMethodId,
    savePaymentMethod,
  }: {
    price: number;
    description: string;
    returnUrl?: string;
    metadata: TMetadata;
    paymentMethodId?: string;
    savePaymentMethod?: boolean;
  }): Promise<string | undefined> {
    const data = {
      amount: {
        value: (price / 100).toFixed(2),
        currency: 'RUB',
      },
      capture: true,
      confirmation:
        returnUrl == null
          ? undefined
          : {
              type: 'redirect',
              return_url: returnUrl,
            },
      description,
      metadata,
      payment_method_id: paymentMethodId,
      save_payment_method: savePaymentMethod,
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
    if (response.data.status === 'canceled') {
      throw new UKassaPaymentCanceledError();
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return response.data?.confirmation?.confirmation_url as string | undefined;
  }

  onPaymentSucceeded<TMetadata extends NonNullable<Metadata>>(
    callback: (webhook: UKassaPaymentWebhook<TMetadata>) => void
  ): VoidFunction {
    this.startWebServer();

    const callbacks = this.paymentSucceededCallbacks as ((
      webhook: UKassaPaymentWebhook<TMetadata>
    ) => void)[];
    callbacks.push(callback);

    return () => {
      const index = callbacks.indexOf(callback);
      if (index !== -1) callbacks.splice(index, 1);
    };
  }

  startWebServer(): void {
    if (this.webServerStarted) return;
    this.webServerStarted = true;

    const app = express();
    const port = getEnv().WEBSERVER_PORT;

    // Включаем CORS для всех маршрутов
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(express.text());

    if (getEnv().NODE_ENV === 'development') {
      app.get('/test', (req, res) => {
        res.send('Hello World!');
      });
    }

    app.post(getEnv().UKASSA_WEBHOOK_SECRET_PATH, (req, res) => {
      try {
        const webhook = (
          typeof req.body === 'string' ? JSON.parse(req.body) : req.body
        ) as UKassaPaymentWebhook;

        if (webhook.object.metadata?.secret === getEnv().UKASSA_WEBHOOK_SECRET_KEY) {
          for (const callback of this.paymentSucceededCallbacks) {
            callback(webhook as UKassaPaymentWebhook<NonNullable<Metadata>>);
          }
        }

        res.status(200).send('OK');
      } catch (error) {
        logger.error('Error in WebServer', error);
        res.status(500).send('Internal server error');
      }
    });

    app.listen(port, () => {
      logger.info(`UKassa WebServer started at http://localhost:${port}`);
    });
  }
}

export const ukassaService = new UKassaService();

import axios from 'axios';
import { randomUUID } from 'node:crypto';
import { getEnv } from '../../config/envVars.ts';
import { type UKassaPaymentWebhook } from './UKassaPaymentWebhook.ts';
import cors from 'cors';
import express from 'express';
import logger from '../../config/logger.ts';

export class UKassaService {
  private readonly paymentSucceededCallbacks: ((webhook: UKassaPaymentWebhook) => void)[] = [];
  private webServerStarted = false;

  async createPayment({
    price,
    description,
    returnUrl,
    metadata,
    paymentMethodId,
  }: {
    price: number;
    description: string;
    returnUrl?: string;
    metadata?: UKassaPaymentWebhook['object']['metadata'];
    paymentMethodId?: string;
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
    return response.data?.confirmation?.confirmation_url as string | undefined;
  }

  onPaymentSucceeded(callback: (webhook: UKassaPaymentWebhook) => void): VoidFunction {
    this.startWebServer();

    this.paymentSucceededCallbacks.push(callback);
    return () => {
      const index = this.paymentSucceededCallbacks.indexOf(callback);
      if (index !== -1) {
        this.paymentSucceededCallbacks.splice(index, 1);
      }
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

    // app.post('/test', (req, res) => {
    //   console.log(req.body);
    //   res.send('Hello World!');
    // });

    app.post(getEnv().UKASSA_WEBHOOK_SECRET_PATH, (req, res) => {
      try {
        const webhook = (
          typeof req.body === 'string' ? JSON.parse(req.body) : req.body
        ) as UKassaPaymentWebhook;

        if (webhook.object.metadata?.secret === getEnv().UKASSA_WEBHOOK_SECRET_KEY) {
          for (const callback of this.paymentSucceededCallbacks) {
            callback(webhook);
          }
        }
      } catch (error) {
        logger.error('Error in WebServer', error);
        res.status(500).send('Internal server error');
      }
    });

    app.listen(port, () => {
      logger.info(`WebServer started at http://localhost:${port}`);
    });
  }
}

export const ukassaService = new UKassaService();

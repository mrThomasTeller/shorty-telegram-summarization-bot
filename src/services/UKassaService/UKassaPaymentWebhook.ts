export type UKassaPaymentWebhook = {
  type: 'notification';
  event: 'payment.succeeded';
  object: {
    id: string;
    status: 'succeeded';
    amount: {
      value: string;
      currency: string;
    };
    income_amount: {
      value: string;
      currency: string;
    };
    description: string;
    recipient: {
      account_id: string;
      gateway_id: string;
    };
    payment_method: {
      type: string;
      id: string;
      saved: boolean;
      title: string;
      account_number: string;
    };
    captured_at: string;
    created_at: string;
    test: boolean;
    refunded_amount: {
      value: string;
      currency: string;
    };
    paid: boolean;
    refundable: boolean;
    metadata: Record<string, unknown>;
  };
};

import { type Subscription } from '@prisma/client';

export const isSubscriptionActive = (subscription: Subscription): boolean =>
  subscription.expires > new Date();

import { type ObjectType } from './ObjectType.ts';

export type UkassaWebhookMetadata = {
  object: ObjectType;
  id: bigint;
  tariffId: string;
  userId: number;
  username: string | undefined;
  secret: string;
};

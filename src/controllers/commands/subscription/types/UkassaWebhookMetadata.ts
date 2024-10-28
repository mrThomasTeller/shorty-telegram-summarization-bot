import { type ObjectType } from './ObjectType';

export type UkassaWebhookMetadata = {
  object: ObjectType;
  id: number;
  tariffId: string;
  userId: number;
  username: string | undefined;
  secret: string;
};

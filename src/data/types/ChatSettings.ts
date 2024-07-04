import { z } from 'zod';

export const chatSettingsSchema = z
  .object({
    notifyItsTimeToSummarize: z.boolean().optional(),
  })
  .strict();

export type ChatSettings = z.infer<typeof chatSettingsSchema>;

import { z } from 'zod';

export const chatSettingsSchema = z
  .object({
    notifyItsTimeToSummarize: z
      .enum(['true', 'false'])
      .transform((val) => val === 'true')
      .optional(),
    autoSummarize: z
      .string()
      .transform((val) => {
        if (val === 'off') {
          return null;
        }

        const [hours, minutes] = val.split(':').map(Number);
        return {
          hours,
          minutes,
        };
      })
      .refine(
        (val) => {
          if (val === null) {
            return true;
          }

          return (
            !Number.isNaN(val.hours) &&
            !Number.isNaN(val.minutes) &&
            val.hours !== undefined &&
            val.minutes !== undefined &&
            val.hours >= 0 &&
            val.hours <= 23 &&
            val.minutes >= 0 &&
            val.minutes <= 59
          );
        },
        {
          message: 'Invalid time format. Please use HH:MM (24-hour format).',
        }
      )
      .optional(),
  })
  .strict();

export type ChatSettings = z.infer<typeof chatSettingsSchema>;

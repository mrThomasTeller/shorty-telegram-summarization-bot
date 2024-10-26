import { type Chat } from '@prisma/client';
import { decryptIfExists } from './encryption.ts';
import { t } from '../config/translations/index.ts';
import { escapeTelegramMarkdown } from './telegramBotMessageUtils.ts';

export function getGroupTitle({
  chatId,
  chat,
  grammarCase = 'nom',
  alwaysAddGroupTerm = false,
  markdown = false,
}: {
  chatId: bigint | number;
  chat: Chat | undefined | null;
  grammarCase?: 'nom' | 'gen' | 'acc';
  alwaysAddGroupTerm?: boolean;
  markdown?: boolean;
}): string {
  const group = t(`terms.group_${grammarCase}`);
  const title = decryptIfExists(chat?.title);
  const id = markdown ? `\`${chatId}\`` : chatId;

  if (title == null) return `${group} ${id}`;
  if (!alwaysAddGroupTerm) return markdown ? `\`${escapeTelegramMarkdown(title)}\`` : title;

  return markdown ? `${group} \`"${escapeTelegramMarkdown(title)}"\`` : `${group} "${title}"`;
}

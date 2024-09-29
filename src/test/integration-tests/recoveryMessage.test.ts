import { type Chat } from '@prisma/client';
import { t } from '../../config/translations/index.ts';
import recoveryMessage from '../../entryPoints/recoveryMessage.ts';
import { type TOmit } from '../../lib/typeUtils.ts';
import { loggerMock } from '../env.ts';
import createContext from './lib/createContext.ts';

describe('recoveryMessage', () => {
  it('respond to messages from non-white chats with maintenance message', async () => {
    const context = createContext();
    const { db, telegramBot } = context;

    const chatBase: TOmit<Chat, 'id'> = {
      isMember: true,
      createdAt: new Date(),
      unsummarizedSymbols: 0,
      news: null,
      notifiedItsTimeToSummarize: false,
      settings: {},
      title: null,
    };

    const chats: Chat[] = [
      { id: 1n, ...chatBase },
      { id: 2n, ...chatBase },
      { id: -1003n, ...chatBase },
    ];
    db.getAllChats.mockResolvedValue(chats);

    await recoveryMessage(context);

    for (const { id } of chats) {
      expect(telegramBot.sendMessage).toHaveBeenCalledWith(
        Number(id),
        expect.stringContaining(t('recovery.message'))
      );
    }

    expect(loggerMock.info).toHaveBeenCalledWith(t('recovery.debugInfo', { count: chats.length }));
  });
});

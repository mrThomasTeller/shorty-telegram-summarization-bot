import { addDays, addMinutes } from 'date-fns';
import { ServicesImpl } from '../../../createServices';
import { mockMessageDate } from '../../../data/convertors';
import summarizeBotServer from '../../../entryPoints/summarizeBotServer';
import type DbService from '../../../services/DbService';
import { TgUser } from '../TgUser';
import { getEnv } from '../../../config/envVars';

jest.setTimeout(10_000);

// fixme точно рассчитывать длину сообщений
// fixme разделить файл на несколько
describe('summarize bot basic cases', () => {
  const services = new ServicesImpl();
  const tgUser = new TgUser(services.telegramBot);

  beforeAll(async () => {
    await tgUser.connect();
  });

  afterAll(async () => {
    await tgUser.disconnect();
  });

  beforeEach(async () => {
    tgUser.clearMessages();
    await clearDb(services.db);
    await summarizeBotServer(services);
  });

  afterEach(async () => {
    services.telegramBot.__bot.removeAllListeners();
  });

  it('should summarize messages for the last day', async () => {
    setDayAgo();
    await tgUser.sendMessage('0');

    setRealTime();
    await expectMinimalCorrectSummary();
    await tgUser.expectNoFurtherDbgMessages();
  });

  it('should not summarize messages if there are no enough messages', async () => {
    await expectMinimalIncorrectSummary(2);
    await tgUser.expectNoFurtherDbgMessages();
  });

  it('should not summarize messages if there are no messages for the last day', async () => {
    setDayAgo();
    await tgUser.sendTestMessages({ count: 3 });

    setRealTime();
    await tgUser.sendSummarizeCommand();
    await tgUser.matchDgbMessagesSnapshot(1);
    await tgUser.expectNoFurtherDbgMessages();
  });

  it("can't exceed 3 summaries per week", async () => {
    await expectMinimalCorrectSummary({ times: 3 });
    await expectMinimalIncorrectSummary();
    await tgUser.expectNoFurtherDbgMessages();
  }, 15_000);

  for (let i = 1; i <= 5; i++) {
    it(`1 summary part, ${i} points`, async () => {
      await expectMinimalCorrectSummary({
        totalLength: Math.ceil(getEnv().SUMMARY_SYMBOLS_FOR_ONE_POINT * (i - 0.5)),
      });
      await tgUser.expectNoFurtherDbgMessages();
    });
  }

  for (let i = 2; i <= 5; i++) {
    it(`${i} summaries parts`, async () => {
      await tgUser.sendTestMessages({
        count: i + 2,
        totalLength: getEnv().SUMMARY_MAX_PART_LENGTH * (i - 0.5),
      });
      await tgUser.sendSummarizeCommand();
      await tgUser.matchDgbMessagesSnapshot(3 + i);
      await tgUser.expectNoFurtherDbgMessages();
    });
  }

  it('5 summaries parts is max', async () => {
    await tgUser.sendTestMessages({
      count: 7,
      totalLength: getEnv().SUMMARY_MAX_PART_LENGTH * 5.5,
    });
    await tgUser.sendSummarizeCommand();
    await tgUser.matchDgbMessagesSnapshot(9);
    await tgUser.expectNoFurtherDbgMessages();
  });

  async function expectMinimalCorrectSummary({
    times = 1,
    messagesCount = 3,
    totalLength,
  }: { times?: number; messagesCount?: number; totalLength?: number } = {}): Promise<void> {
    for (let i = 0; i < times; i++) {
      await tgUser.sendTestMessages({ count: messagesCount, totalLength });
      await tgUser.sendSummarizeCommand();
      await tgUser.matchDgbMessagesSnapshot(4);
    }
  }

  async function expectCorrectLongSummary(
    messagesCount: number,
    partsCount: number
  ): Promise<void> {
    await tgUser.sendTestMessages({ count: messagesCount });
    await tgUser.sendSummarizeCommand();
    await tgUser.matchDgbMessagesSnapshot(3 + partsCount);
  }

  async function expectMinimalIncorrectSummary(messagesCount = 3, times = 1): Promise<void> {
    for (let i = 0; i < times; i++) {
      await tgUser.sendTestMessages({ count: messagesCount });
      await tgUser.sendSummarizeCommand();
      await tgUser.matchDgbMessagesSnapshot(1);
    }
  }
});

async function clearDb(db: DbService): Promise<void> {
  const tables = await db.__prisma.$queryRawUnsafe<{ tablename: string }[]>(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public';
    `);

  for (const table of tables) {
    if (table.tablename === '_prisma_migrations') continue;
    await db.__prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table.tablename}" CASCADE;`);
  }
}

function setDayAgo(): void {
  mockMessageDate(addMinutes(addDays(new Date(), -1), -1));
}

function setRealTime(): void {
  mockMessageDate(undefined);
}

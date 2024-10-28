import { getEnv } from '../src/config/envVars';
import { type ServicesImpl, createServices } from '../src/createServices';
// import _ from 'lodash';
// import examples from '../docs/summarize-examples.json';
// import { encrypt } from '../src/data/encryption';
// import { hoursAgo } from '../src/lib/common/date';
// import { required } from '../src/lib/common/lang';

// const myId = 71346730;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function main({ db }: ServicesImpl): Promise<void> {
  // const [user] = await db.getOrCreateUser({
  //   id: myId,
  //   username: encrypt('mrThomasTeller'),
  //   firstName: encrypt('Thomas'),
  //   lastName: encrypt('Teller'),
  // });
  // const { chat } = await db.getOrCreateChat(myId, user.username ?? undefined);
  // await Promise.all(
  //   _.range(-1, -2000).map((id) => {
  //     const text = required(examples.messages[Math.abs(id) % examples.messages.length]);
  //     return db.createChatMessage({
  //       messageId: id,
  //       chatId: chat.id,
  //       userId: user.id,
  //       date: hoursAgo(6),
  //       text: encrypt(text),
  //     });
  //   })
  // );
  // await db.setSubscription(
  //   { userId: Number(user.id) },
  //   { id: Number(user.id), username: decryptIfExists(user.username) ?? undefined },
  //   '+20s,x3'
  // );
}

if (getEnv().NODE_ENV === 'development') {
  const services = createServices();
  try {
    await main(services);
  } finally {
    await services.prisma.$disconnect();
  }
}

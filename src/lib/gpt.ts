import { ChatGPTAPI, ChatGPTError } from 'chatgpt';
import { wait } from './async.js';
import assert from 'assert';
import { required } from './utils.js';

assert(process.env.GPT_API_KEY);

export async function sendMessageToGpt({
  text,
  maxTries = 5,
  onBusy,
  onBroken,
  api = new ChatGPTAPI({ apiKey: required(process.env.GPT_API_KEY) }),
}: {
  text: string;
  maxTries?: number;
  onBusy?: () => void | Promise<void>;
  onBroken?: () => void | Promise<void>;
  api?: ChatGPTAPI;
}): Promise<string> {
  try {
    const result = await api.sendMessage(text, {
      completionParams: { max_tokens: 2048 },
    });
    return result.text;
  } catch (error) {
    // Too Many Requests - ждём 25 секунд
    if (error instanceof ChatGPTError && error.statusCode === 429) {
      if (maxTries === 1) {
        if (onBroken !== undefined) await onBroken();
        throw new Error('Максимальное количество попыток отправить сообщение GPT достигнуто');
      }

      if (onBusy !== undefined) await onBusy();
      await wait(25_000);
      return await sendMessageToGpt({ text, onBusy, onBroken, maxTries: maxTries - 1 });
    }
    throw error;
  }
}

// import { execa } from 'execa';
// import path from 'path';
// import { fileURLToPath } from 'url';

// const __dirname = path.dirname(fileURLToPath(import.meta.url));

// export async function sendMessageToGpt(text, onBusy, tries = 0) {
//   try {
//     const result = await execa('python3', ['gpt4.py', text], {
//       cwd: path.join(__dirname, '../gpt4free/'),
//     });

//     if (!result.stdout || !result.stdout.trim()) {
//       throw new Error('Incorrect response');
//     }

//     return result.stdout;
//   } catch (error) {
//     console.log('try again');

//     if (tries > 10) {
//       return 'Error :(';
//     }
//     onBusy();
//     return sendMessageToGpt(text, onBusy, tries + 1);
//   }
// }

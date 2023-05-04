// eslint-disable-next-line import/no-unresolved
import { ChatGPTAPI } from 'chatgpt';
import { wait } from './async.js';

const api = new ChatGPTAPI({ apiKey: process.env.GPT_API_KEY });

export async function sendMessageToGpt(text, onBusy) {
  try {
    const result = await api.sendMessage(text, {
      completionParams: { max_tokens: 2048 },
    });
    return result.text;
  } catch (error) {
    // Too Many Requests - ждём 25 секунд
    if (error.statusCode === 429) {
      if (onBusy) onBusy();
      await wait(25_000);
      return sendMessageToGpt(text, onBusy);
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

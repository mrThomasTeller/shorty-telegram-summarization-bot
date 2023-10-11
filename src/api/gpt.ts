import type GptService from '../services/GptService.ts';
import { getEnv } from '../config/envVars.ts';
import { ChatGPTError, type ChatMessage } from 'chatgpt';
import { type Observable, map, mergeMap, of } from 'rxjs';
import { either, function as fp } from 'fp-ts';
import { convertPromiseToEither } from '../lib/fp.ts';
import _ from 'lodash';
import { repeatWithDelay, stopWhen } from '../lib/rxOperators.ts';

export type GptResultCase =
  | { type: 'responseFromGPT'; text: string }
  | { type: 'maxTriesExceeded'; error: Error }
  | { type: 'tooManyRequests'; error: Error }
  | { type: 'unknownError'; error: Error };

export const sendMessageToGptWithRetries$ = ({
  text,
  maxTries = 5,
  retryTime = getEnv().RETRY_GPT_QUERY_TIME,
  gpt,
}: {
  text: string;
  maxTries?: number;
  retryTime?: number;
  gpt: GptService;
}): Observable<GptResultCase> =>
  // todo refactor (may be make own retryIf?)
  of(text).pipe(
    mergeMap(sendMessageToGpt(gpt)),
    repeatWithDelay(retryTime),
    map((result, index) => convertGptApiResponseToResultCase(result, index === maxTries - 1)),
    stopWhen((result) =>
      _.includes(['maxTriesExceeded', 'responseFromGPT', 'unknownError'], result.type)
    )
  );

const convertErrorToGptResultCase = _.curry((lastTry: boolean, error: Error): GptResultCase => {
  if (error instanceof ChatGPTError && error.statusCode === 429) {
    if (lastTry) {
      return { type: 'maxTriesExceeded', error };
    }
    return { type: 'tooManyRequests', error };
  }
  return { type: 'unknownError', error };
});

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const sendMessageToGpt = (gpt: GptService) =>
  fp.flow(
    (text: string) =>
      gpt.sendMessage(text, {
        completionParams: { max_tokens: 2048 },
      }),
    convertPromiseToEither<Error>()
  );

const convertGptApiResponseToResultCase = (
  result: either.Either<Error, ChatMessage>,
  lastTry: boolean
): GptResultCase =>
  fp.pipe(
    result,
    either.match(
      convertErrorToGptResultCase(lastTry),
      (response): GptResultCase => ({ type: 'responseFromGPT', text: response.text })
    )
  );

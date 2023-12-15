import { getEnv } from '../config/envVars.js';
import { ChatGPTError } from 'chatgpt';
import { map, mergeMap, of } from 'rxjs';
import { either, function as fp } from 'fp-ts';
import { convertPromiseToEither } from '../lib/fp.js';
import _ from 'lodash';
import { repeatWithDelay, stopWhen } from '../lib/rxOperators.js';
export const sendMessageToGptWithRetries$ = ({ text, maxTries = 5, retryTime = getEnv().RETRY_GPT_QUERY_TIME, gpt, }) => 
// todo refactor (may be make own retryIf?)
of(text).pipe(mergeMap(sendMessageToGpt(gpt)), repeatWithDelay(retryTime), map((result, index) => convertGptApiResponseToResultCase(result, index === maxTries - 1)), stopWhen((result) => _.includes(['maxTriesExceeded', 'responseFromGPT', 'unknownError'], result.type)));
const convertErrorToGptResultCase = _.curry((lastTry, error) => {
    if (error instanceof ChatGPTError && error.statusCode === 429) {
        if (lastTry) {
            return { type: 'maxTriesExceeded', error };
        }
        return { type: 'tooManyRequests', error };
    }
    return { type: 'unknownError', error };
});
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const sendMessageToGpt = (gpt) => fp.flow((text) => gpt.sendMessage(text, {
    completionParams: { max_tokens: 2048 },
}), convertPromiseToEither());
const convertGptApiResponseToResultCase = (result, lastTry) => fp.pipe(result, either.match(convertErrorToGptResultCase(lastTry), (response) => ({
    type: 'responseFromGPT',
    text: response.text,
})));

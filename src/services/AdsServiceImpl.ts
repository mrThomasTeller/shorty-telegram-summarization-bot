import { getEnv } from '../config/envVars';
import logger from '../config/logger';
import type AdsService from './AdsService';

export default class AdsServiceImpl implements AdsService {
  async showAds(chatId: number): Promise<void> {
    const headers = new Headers();
    headers.append('Authorization', `bearer ${getEnv().GRAM_ADS_TOKEN}`);

    const sendPostDto = { SendToChatId: chatId };
    const json = JSON.stringify(sendPostDto);
    const content = new Blob([json], { type: 'application/json' });

    const response = await fetch('https://api.gramads.net/ad/SendPost', {
      method: 'POST',
      body: content,
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to send ads to chat ${chatId}`);
    }

    logger.info(`Ads sent to chat ${chatId}`);
  }
}

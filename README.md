# Shorty - Telegram Summarization Bot

<p align="center"><img src="logo.png"></p>

Shorty 🤖 (https://t.me/shorty_chat_bot) - is a telegram bot that makes a short summarization of chat messages for you. If you have a chat room that can accumulate hundreds of messages in a day, Shorty will save you time and make a short summary of them for you.

Using this repo you can deploy your own instance of Shorty bot.

## Installation and Usage

1. Create your Open AI account and get API key from https://platform.openai.com/account/api-keys
2. Create telegram bot and get API key using https://telegram.me/BotFather
3. Be sure you have docker installed
4. Create and edit `.env` file from `.env.example`
5. run

```bash
docker compose up --detach
```

6. Add your bot to the group chat
7. Talk in the group chat
8. Use `/summarize@shorty_chat_bot` command to get a summary of the chat (replace `shorty_chat_bot` with your bot name)

export default {
  recovery: {
    message:
      '🦾🤖 Бот снова вернулся к работе! Правда он не знает о тех сообщениях, которые вы посылали пока он был на обслуживании. Теперь он опять запоминает все ваши новые сообщения и с удовольствием сделает краткую выжимку для вас!',
    debugInfo: 'Сообщения отправлены в {{count}} $t(_terms.chat, {"count": {{count}}})!',
    cantSendMessageError: 'Не могу отправить сообщение: {{message}}',
  },
  commands: {
    'summarize.description': 'Сделать выжимку сообщений за последний день',
    'ping.description': 'Проверить, что бот живой',
    'help.description': 'Получить помощь по работе бота',
    'start.description': 'Начать работу с ботом',
    'tariff.description': 'Узнать текущий тариф',
    activate: {
      description: 'Активировать премиум тариф',
      adminNotification: '🙌 У нас новый подписчик! Новый ключ для тарифа "{{tariff}}": `{{key}}`',
      errors: {
        badKey:
          "🔑 Неправильный ключ активации. Обратитесь в <a href='https://boosty.to/artyom.bakharev'>личные сообщения на boosty</a> или в поддержку в телеграмме: @shorty_support_bot.",
        useChat:
          '🔑 Отправьте эту команду в групповой чат, для которого вы хотите активировать премиум: `/activate@{{botName}} chat {{key}}`\n\nЕсли же вы хотите активировать премиум для себя то напишите мне в ответ команду: `/activate@{{botName}} user {{key}}`',
      },
    },
    settings: {
      description: 'Изменить настройки',
    },
  },
  server: {
    maintenanceMessage:
      '😴 Бот временно отключен для технического обслуживания. Пожалуйста, попробуйте позже.',
  },
  summarize: {
    gptQuery:
      'Сделай краткую выжимку этих сообщений на русском языке. В конце выжимки поставь подходящие по смыслу emoji вместо точки:\n{{text}}',
    gptQueryWithPoints:
      'Сделай краткую выжимку этих сообщений в виде {{pointsCount}} пунктов идущих в хронологическом порядке. Каждый пункт - одно предложение на русском языке с подходящим по смыслу emoji в конце без точки:\n{{text}}',
    message: {
      start: '⚙️ Собираю сообщения за последний день...',
      header: '🔡 Краткая выжимка:',
      tooManyMessages:
        'Сообщений накопилось очень много 🤯 Я смогу сделать выжимку только из самых последних. <a href="https://boosty.to/artyom.bakharev/posts/7ace6829-b612-448f-8b0e-583c8aad964e">⚡️ Увеличить лимит</a>',
      end: {
        free: '😌 Это всё\n🔋 У вас $t(_terms.last, {"count": {{free}}}) {{free}} из {{freeTotal}} $t(_terms.freeSummary_gen, {"count": {{freeTotal}}}) на этой неделе (<a href="https://boosty.to/artyom.bakharev/posts/7ace6829-b612-448f-8b0e-583c8aad964e">⚡️ увеличить лимит</a>)',
        premiumWithFree:
          '😌 Это всё\n🔋 У вас $t(_terms.last, {"count": {{free}}}) {{free}} $t(_terms.freeSummary, {"count": {{free}}}) на неделю и {{premium}} $t(_terms.premiumSummary, {"count": {{premium}}}) на месяц',
        premiumNoFree: '😌 Это всё\n🔋 У вас осталось {{premium}} премиум выжимок на месяц',
        premiumEnded:
          '😌 Это всё\n🔋 У вас закончились премиум выжимки на месяц. Подождите следующей недели или <a href="https://boosty.to/artyom.bakharev/posts/293f0cc3-51b4-4df6-a98c-52d98f9b6ea2">⚡️ переходите на более высокий тариф</a>',
      },
      dontShowAds:
        '🚫 <a href="https://boosty.to/artyom.bakharev/posts/7ace6829-b612-448f-8b0e-583c8aad964e">⚡️ Не хочу видеть рекламу!</a>',
    },
    errors: {
      queryProcess: 'Произошла ошибка при обработке запроса. Пожалуйста, попробуйте еще раз.',
      tooManyRequestsToGpt: '😮‍💨 Бот усердно трудится, нужно немножко подождать',
      maxQueriesToGptExceeded:
        '💔 С ботом что-то случилось... Попробуйте позже. Мы починим его и сообщим вам как можно скорее.',
      noMessages: '🙄 Нет сообщений для создания выжимки. Вы пообщайтесь, а потом позовите меня 😉',
      fewMessages:
        '🙄 Слишком мало сообщений для создания выжимки. Нужно хотя бы {{count}}. Вы пообщайтесь, а потом позовите меня 😉',
      maxSummariesExceeded: {
        free: '🤯 Вы можете делать не более {{count}} $t(_terms.summary_gen, {"count": {{count}}}) в неделю. Приходите на следующей неделе или <a href="https://boosty.to/artyom.bakharev/posts/7ace6829-b612-448f-8b0e-583c8aad964e">⚡️ оформите подписку</a> 😉',
        premium:
          '🤯 Бесплатные и премиум выжимки кончились. Приходите на следующей неделе или <a href="https://boosty.to/artyom.bakharev/posts/293f0cc3-51b4-4df6-a98c-52d98f9b6ea2">⚡️ оформите более высокий тариф</a> 😉',
      },
    },
    debug: {
      queryInfo: 'Summarize request from chat {{chatId}}, user: {{userId}}',
    },
  },
  ping: {
    response:
      '💻 Бот тут\nEnvironment: {{nodeEnv}}\nVersion: {{version}}\nChat ID: {{chatId}}\nUser ID: {{userId}}\nUsername: {{username}}',
  },
  tariff: {
    free: '🆓 Сейчас вы на бесплатном тарифе. У вас есть {{count}} $t(_terms.freeSummary, {"count": {{count}}}) в неделю.',
    premium: '🚀 Сейчас вы на тарифе: "{{name}}". Спасибо, за вашу поддержку 🙏',
  },

  // Nominative - именительный падеж (кто? что?)
  // Genitive - родительный падеж (кого? чего?)
  // Accusative - винительный падеж (кого? что?)
  // Dative - дательный падеж (кому? чему?)
  // Instrumental - творительный падеж (кем? чем?)
  // Prepositional - предложный падеж (о ком? о чём?)
  _terms: {
    chat_few: 'чата',
    chat_one: 'чат',
    chat: 'чатов',
    freeSummary_few: 'бесплатные выжимки',
    freeSummary_one: 'бесплатная выжимка',
    freeSummary: 'бесплатных выжимок',
    freeSummary_gen_one: 'бесплатной выжимки',
    freeSummary_gen: 'бесплатных выжимок',
    last_one: 'осталась',
    last: 'осталось',
    premiumSummary_few: 'премиум выжимки',
    premiumSummary_one: 'премиум выжимка',
    premiumSummary: 'премиум выжимок',
    summary_gen_one: 'выжимки',
    summary_gen: 'выжимок',
  },
} as const;

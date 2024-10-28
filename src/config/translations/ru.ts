// fixme tsub ссылки на подписку должны вести на конкретную подписку

export default {
  recovery: {
    message:
      '🦾🤖 Бот снова вернулся к работе! Правда он не знает о тех сообщениях, которые вы посылали пока он был на обслуживании. Теперь он опять запоминает все ваши новые сообщения и с удовольствием сделает краткую выжимку для вас!',
    debugInfo: 'Сообщения отправлены в {{count}} $t(terms.chat, {"count": {{count}}})!',
    cantSendMessageError: 'Не могу отправить сообщение: {{message}}',
  },
  commands: {
    'summarize.description': 'Сделать выжимку сообщений за последний день',
    'ping.description': 'Проверить, что бот живой',
    'help.description': 'Получить помощь по работе бота',
    'start.description': 'Начать работу с ботом',
    'tariff.description': 'Узнать текущий тариф',
    'subscription.description': 'Приобрести или изменить платную подписку',
    settings: {
      description: 'Изменить настройки',
    },
  },
  server: {
    maintenanceMessage:
      '😴 Бот временно отключен для технического обслуживания. Пожалуйста, попробуйте позже.',

    privateChatOnly: 'Чтобы я смог выполнить эту команду, напиши мне её в ЛС @{{botName}} 😉',
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
        'Сообщений накопилось очень много 🤯 Я смогу сделать выжимку только из самых последних. <a href="https://t.me/{{botName}}?start=subscription={{chatId}}">⚡️ Увеличить лимит</a>',
      end: '😌 Это всё',
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
        free: '🤯 Вы можете делать не более {{count}} $t(terms.summary_gen, {"count": {{count}}}) в неделю. Приходите на следующей неделе или <a href="https://t.me/{{botName}}?start=subscription={{chatId}}">⚡️ оформите подписку</a> 😉',
        premium:
          '🤯 Бесплатные и премиум выжимки кончились. Приходите на следующей неделе, чтобы получить бесплатные выжимки, или <a href="https://t.me/{{botName}}?start=subscription={{chatId}}">⚡️ оформите более высокий тариф</a> 😉',
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
    free: '🆓 Сейчас вы на бесплатном тарифе.\n{{rest}}',
    premium: '🚀 Сейчас вы на тарифе: "{{name}}"{{price}}\n{{rest}}\n{{expires}}{{thanks}}',
    thanks: '\nСпасибо, за вашу поддержку 🙏',
  },

  shared: {
    rest: {
      free: '🔋 У вас $t(terms.last, {"count": {{free}}}) {{free}} из {{freeTotal}} $t(terms.freeSummary_gen, {"count": {{freeTotal}}}) на этой неделе (<a href="https://t.me/{{botName}}?start=subscription={{chatId}}">⚡️ увеличить лимит</a>)',
      premium: '🔋 У вас осталось {{premium}} премиум выжимок на месяц',
      premiumEnded:
        '🔋 У вас закончились премиум выжимки на месяц. Подождите следующей недели, чтобы получить бесплатные выжимки, или <a href="https://t.me/{{botName}}?start=subscription={{chatId}}">⚡️ переходите на более высокий тариф</a>',
    },
    freeSummariesCount: '{{count}} $t(terms.freeSummary_gen, {"count": {{count}}})',
  },

  // падеж - case
  // Nominative - именительный падеж (кто? что?)
  // Genitive - родительный падеж (кого? чего?)
  // Accusative - винительный падеж (кого? что?)
  // Dative - дательный падеж (кому? чему?)
  // Instrumental - творительный падеж (кем? чем?)
  // Prepositional - предложный падеж (о ком? о чём?)
  terms: {
    chat_few: 'чата',
    chat_one: 'чат',
    chat: 'чатов',
    freeSummary_few: 'бесплатные выжимки',
    freeSummary_one: 'бесплатная выжимка',
    freeSummary: 'бесплатных выжимок',
    freeSummary_gen_one: 'бесплатной выжимки',
    freeSummary_gen: 'бесплатных выжимок',
    group_nom: 'группа',
    group_acc: 'группу',
    group_gen: 'группы',
    last_one: 'осталась',
    last: 'осталось',
    premiumSummary_few: 'премиум выжимки',
    premiumSummary_one: 'премиум выжимка',
    premiumSummary: 'премиум выжимок',
    subscription_nom_one: 'подписка',
    subscription_acc_one: 'подписку',
    summary_gen_one: 'выжимки',
    summary_gen: 'выжимок',
  },
} as const;

#!/bin/bash

# Удаление текущей истории
rm -f ~/.bash_history

# Создание пустого файла истории с запретом на запись
touch ~/.bash_history
chmod 000 ~/.bash_history

# Отключение сохранения истории для текущей сессии
unset HISTFILE

# Настройка отключения истории для всех будущих сессий
{
  echo "export HISTSIZE=0"
  echo "export HISTFILESIZE=0"
  echo "export HISTIGNORE='*'"
} >> ~/.bashrc

# Применение изменений для текущей сессии
source ~/.bashrc

echo "История удалена и сохранение отключено для текущей и всех будущих сессий."

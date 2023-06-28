# SMS Aero class for node

```markdown
# Клиент SmsAero для Node.js

Этот модуль Node.js разработан для взаимодействия с API SmsAero. Он включает в себя различные функции для отправки SMS-сообщений, проверки статуса сообщений, получения списка сообщений, а также управления контактами и группами.

## Предварительные условия

- Node.js
- npm или yarn

## Установка

Используйте пакетный менеджер npm или yarn для установки клиента SmsAero.

С npm:
```sh
npm install smsaero
```

С yarn:
```sh
yarn add smsaero
```

## Использование

Во-первых, импортируйте класс SmsAero и связанные с ним классы ошибок из модуля:

```javascript
const { SmsAero, SmsAeroError, SmsAeroHTTPError } = require('smsaero');
```

Вы можете создать экземпляр клиента SmsAero, используя свою электронную почту, ключ API и другие параметры конфигурации:

```javascript
const client = new SmsAero('your@email.com', 'your-api-key');
```

Затем вы можете вызывать методы клиента для взаимодействия с API SmsAero.

```javascript
// Отправка SMS
client.send('1234567890', 'Привет, мир!')
  .then(response => console.log(response))
  .catch(error => console.error(error));

// Проверка баланса
client.balance()
  .then(response => console.log(response))
  .catch(error => console.error(error));

// Другие методы согласно API...
```

## Обработка ошибок

Класс SmsAero использует два типа ошибок, `SmsAeroError` и `SmsAeroHTTPError`, чтобы сигнализировать о сбое операции.

```javascript
try {
  const response = await client.send('1234567890', 'Привет, мир!');
  console.log(response);
} catch (error) {
  if (error instanceof SmsAeroError) {
    console.error('Не удалось из-за ошибки SmsAero:', error.message);
  } else if (error instanceof SmsAeroHTTPError) {
    console.error('Не удалось из-за HTTP ошибки:', error.message);
  } else {
    console.error('Произошла неизвестная ошибка:', error);
  }
}
```

## Вклад

Предложения по улучшению приветствуются. Для крупных изменений, пожалуйста, сначала откройте вопрос, чтобы обсудить, что вы хотели бы изменить.

## Лицензия

[MIT](https://choosealicense.com/licenses/mit/)
```

Примечание: Обязательно замените `'your@email.com'` и `'your-api-key'` на свой фактический адрес электронной почты и ключ API.


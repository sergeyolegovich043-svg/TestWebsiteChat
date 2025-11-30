# SecureChat tester (Vite + React)

Локальный стенд для проверки REST и WebSocket API сервиса securechat. Проект собран на Vite + React + TypeScript с минимальным UI на Chakra UI.

## Быстрый старт
1. Установите зависимости (требуется Node 20+):
   ```bash
   npm install
   ```
2. Запустите дев-сервер:
   ```bash
   npm run dev
   ```
3. Откройте страницу, укажите базовый URL API, JWT токен и chatId.

## Функциональность
- Запрос списка чатов и истории сообщений через REST (`fetch` с автоматическим заголовком Authorization).
- Отправка новых сообщений в выбранный чат.
- Подключение к WebSocket (STOMP, endpoint `/ws`) с подпиской на `messages` и `typing` для указанного `chatId`.
- Отправка typing-событий на `/app/typing`.
- Лог входящих событий и диагностические логи STOMP клиента.

## Структура
- `src/api` — типы DTO и простой REST-клиент.
- `src/hooks/useStompClient.ts` — хук для подключения STOMP (SockJS + JWT заголовок).
- `src/ws` — определения топиков/направлений.
- `src/components/ChatTester.tsx` — основная страница с UI.

## Скрипты
- `npm run dev` — dev-сервер Vite.
- `npm run build` — сборка продакшена.
- `npm run lint` — проверка ESLint.

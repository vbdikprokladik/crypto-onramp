# abdikproklad — покупка SOL через Stripe onramp (Privy)

Одностраничный сайт: пользователь входит по почте/Google, Privy создаёт ему
встроенный Solana-кошелёк, кнопка «Купить SOL» открывает окно оплаты Stripe.

## Что нужно сделать в дашборде Privy

1. **Domains** (уже начал): в оба поля добавь
   - `https://abdikproklad.eu.cc`
   - `http://localhost:3000` — для локальной разработки
   - домен превью с Vercel/Netlify, если будешь им пользоваться
2. **Funding → Methods**: Card onramps включён, Stripe — Enabled ✅
3. **Funding → Token and network**: добавь **Solana**, актив **SOL**
4. **User management → Embedded wallets**: включи автосоздание Solana-кошелька
   (`createOnLogin` в коде это уже просит, но переключатель в дашборде тоже нужен)
5. **Login methods**: включи Email и Google

## Запуск локально

```bash
npm install
npm run dev
```

Откроется `http://localhost:3000`.

## Сборка

```bash
npm run build
```

Готовые файлы появятся в папке `dist/`.

## Переменные окружения (необязательно)

App ID уже вшит в код — он публичный, это нормально. Если захочешь вынести:

```
VITE_PRIVY_APP_ID=cmt74w3xj01tk0ci8a1epzvrz
VITE_SOLANA_RPC=https://api.mainnet-beta.solana.com
```

⚠️ **App secret в этот проект класть нельзя.** Он нужен только для серверных
вызовов Privy API и в коде фронтенда мгновенно утекает всем посетителям.

## Публичный RPC

По умолчанию используется `api.mainnet-beta.solana.com`. Он бесплатный, но
жёстко ограничен по запросам. Если сайтом начнут реально пользоваться — заведи
ключ на Helius или QuickNode и положи его в `VITE_SOLANA_RPC`.

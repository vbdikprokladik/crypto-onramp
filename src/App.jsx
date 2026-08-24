import {useMemo, useState} from 'react';
import {usePrivy} from '@privy-io/react-auth';
import {useFundWallet} from '@privy-io/react-auth/solana';

const PRESETS = ['0.25', '0.5', '1'];

function shorten(address) {
  if (!address) return '';
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

// Privy иногда не принимает часть параметров — пробуем от подробного к простому.
function buildAttempts(address, amount) {
  return [
    {address, options: {amount: String(amount), asset: 'SOL'}},
    {address, options: {amount: String(amount)}},
    {address}
  ];
}

const RETRYABLE = /not enabled|not supported|unsupported|invalid|unknown/i;

export default function App() {
  const {ready, authenticated, login, logout, user} = usePrivy();
  const {fundWallet} = useFundWallet();

  const [amount, setAmount] = useState('0.5');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const solanaAddress = useMemo(() => {
    const accounts = user?.linkedAccounts ?? [];
    const embedded = accounts.find(
      (a) => a.type === 'wallet' && a.chainType === 'solana' && a.walletClientType === 'privy'
    );
    const any = accounts.find((a) => a.type === 'wallet' && a.chainType === 'solana');
    return (embedded || any)?.address ?? null;
  }, [user]);

  const amountValid = Number(amount) > 0;

  async function handleBuy() {
    if (!solanaAddress || !amountValid) return;
    setError(null);
    setBusy(true);

    let lastError = null;
    for (const payload of buildAttempts(solanaAddress, amount)) {
      try {
        await fundWallet(payload);
        setBusy(false);
        return;
      } catch (e) {
        lastError = e;
        const message = e?.message || '';
        // если ошибка не про неподдерживаемые параметры — дальше пробовать смысла нет
        if (!RETRYABLE.test(message)) break;
      }
    }

    setError(lastError?.message || 'Не удалось открыть окно оплаты.');
    setBusy(false);
  }

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(solanaAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* буфер обмена недоступен */
    }
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <span className="mark">◎</span>
          <span>abdikproklad</span>
        </div>
        {ready && authenticated && (
          <button className="ghost" onClick={logout}>
            Выйти
          </button>
        )}
      </header>

      <main className="main">
        <section className="hero">
          <h1>Купить SOL за пару минут</h1>
          <p className="lede">
            Карта, Apple&nbsp;Pay или Google&nbsp;Pay. Кошелёк создаётся автоматически при входе —
            ничего скачивать и записывать не нужно.
          </p>
        </section>

        <section className="card">
          {!ready && <div className="skeleton">Загрузка…</div>}

          {ready && !authenticated && (
            <>
              <p className="card-lede">Войди по почте или через Google, чтобы получить кошелёк.</p>
              <button className="primary" onClick={login}>
                Войти
              </button>
            </>
          )}

          {ready && authenticated && (
            <>
              <div className="wallet-row">
                <div>
                  <div className="label">Твой кошелёк Solana</div>
                  <div className="address" title={solanaAddress || ''}>
                    {solanaAddress ? shorten(solanaAddress) : 'создаётся…'}
                  </div>
                </div>
                {solanaAddress && (
                  <button className="ghost small" onClick={copyAddress}>
                    {copied ? 'Скопировано' : 'Копировать'}
                  </button>
                )}
              </div>

              <div className="label spaced">Сколько покупаем</div>
              <div className="presets">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    className={`preset ${amount === p ? 'active' : ''}`}
                    onClick={() => setAmount(p)}
                  >
                    {p} SOL
                  </button>
                ))}
              </div>

              <div className="amount-field">
                <input
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(',', '.'))}
                  aria-label="Количество SOL"
                />
                <span className="suffix">SOL</span>
              </div>

              <button
                className="primary"
                disabled={!solanaAddress || !amountValid || busy}
                onClick={handleBuy}
              >
                {busy ? 'Открываю оплату…' : 'Купить SOL'}
              </button>

              {error && <p className="error">{error}</p>}

              <p className="fine">
                Оплата проходит на стороне Stripe. Комиссии и лимиты показываются перед
                подтверждением.
              </p>
            </>
          )}
        </section>

        <section className="steps">
          <div className="step">
            <span className="num">1</span>
            <h3>Вход</h3>
            <p>Почта или Google. Кошелёк создаётся сам.</p>
          </div>
          <div className="step">
            <span className="num">2</span>
            <h3>Оплата</h3>
            <p>Карта, Apple Pay или Google Pay через Stripe.</p>
          </div>
          <div className="step">
            <span className="num">3</span>
            <h3>Готово</h3>
            <p>SOL приходит на твой адрес в Solana.</p>
          </div>
        </section>
      </main>

      <footer className="foot">
        <span>abdikproklad.eu.cc</span>
        <span className="dot">·</span>
        <span>кошельки — Privy, оплата — Stripe</span>
      </footer>
    </div>
  );
}

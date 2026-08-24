import {useCallback, useEffect, useMemo, useState} from 'react';
import {usePrivy, useFiatOnramp} from '@privy-io/react-auth';
import {useExportWallet} from '@privy-io/react-auth/solana';
import {createSolanaRpc} from '@solana/kit';

// CAIP-2 идентификатор основной сети Solana
const SOLANA_CHAIN = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';

const TOKENS = {
  USDC: {label: 'USDC', asset: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'},
  'SOL-1': {label: 'SOL #1', asset: 'sol'},
  'SOL-2': {label: 'SOL #2', asset: '11111111111111111111111111111111'},
  'SOL-3': {label: 'SOL #3', asset: 'SOL'}
};

const PRESETS = ['25', '50', '100'];
const RPC_URL = import.meta.env.VITE_SOLANA_RPC || 'https://api.mainnet-beta.solana.com';

function shorten(address) {
  if (!address) return '';
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export default function App() {
  const {ready, authenticated, login, logout, user} = usePrivy();
  const {fund} = useFiatOnramp();
  const {exportWallet} = useExportWallet();

  const [token, setToken] = useState('SOL');
  const [amount, setAmount] = useState('50');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [copied, setCopied] = useState(false);
  const [balance, setBalance] = useState(null);

  const solanaAddress = useMemo(() => {
    const accounts = user?.linkedAccounts ?? [];
    const embedded = accounts.find(
      (a) => a.type === 'wallet' && a.chainType === 'solana' && a.walletClientType === 'privy'
    );
    const any = accounts.find((a) => a.type === 'wallet' && a.chainType === 'solana');
    return (embedded || any)?.address ?? null;
  }, [user]);

  const amountValid = Number(amount) > 0;

  const refreshBalance = useCallback(async () => {
    if (!solanaAddress) return;
    try {
      const rpc = createSolanaRpc(RPC_URL);
      const {value} = await rpc.getBalance(solanaAddress).send();
      setBalance(Number(value) / 1_000_000_000);
    } catch {
      setBalance(null);
    }
  }, [solanaAddress]);

  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  async function handleBuy() {
    if (!solanaAddress || !amountValid) return;
    setError(null);
    setNotice(null);
    setBusy(true);

    try {
      const result = await fund({
        source: {
          assets: ['usd', 'eur'],
          defaultAsset: 'usd'
        },
        destination: {
          asset: TOKENS[token].asset,
          chain: SOLANA_CHAIN,
          address: solanaAddress
        },
        environment: 'production',
        defaultAmount: String(amount)
      });

      if (result?.status === 'confirmed') {
        setNotice('Оплата прошла. Монеты появятся на балансе в течение нескольких минут.');
        refreshBalance();
      } else if (result?.status === 'submitted') {
        setNotice('Платёж отправлен и обрабатывается провайдером.');
      }
    } catch (e) {
      setError(e?.message || 'Не удалось открыть окно оплаты.');
    } finally {
      setBusy(false);
    }
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
          <h1>Купить крипту за пару минут</h1>
          <p className="lede">
            Карта, Apple&nbsp;Pay или Google&nbsp;Pay. Кошелёк создаётся автоматически при входе —
            ничего скачивать и записывать не нужно.
          </p>
        </section>

        <section className="card">
          {!ready && <div className="skeleton">Загрузка…</div>}

          {ready && !authenticated && (
            <>
              <p className="card-lede">Войди по почте, чтобы получить кошелёк.</p>
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
                  <div className="balance">
                    {balance === null ? 'баланс недоступен' : `${balance.toFixed(4)} SOL`}
                  </div>
                </div>
                {solanaAddress && (
                  <button className="ghost small" onClick={copyAddress}>
                    {copied ? 'Скопировано' : 'Копировать'}
                  </button>
                )}
              </div>

              <div className="label spaced">Что покупаем</div>
              <div className="presets two">
                {Object.keys(TOKENS).map((key) => (
                  <button
                    key={key}
                    className={`preset ${token === key ? 'active' : ''}`}
                    onClick={() => setToken(key)}
                  >
                    {TOKENS[key].label}
                  </button>
                ))}
              </div>

              <div className="label spaced">На какую сумму</div>
              <div className="presets">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    className={`preset ${amount === p ? 'active' : ''}`}
                    onClick={() => setAmount(p)}
                  >
                    ${p}
                  </button>
                ))}
              </div>

              <div className="amount-field">
                <input
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(',', '.'))}
                  aria-label="Сумма в долларах"
                />
                <span className="suffix">USD</span>
              </div>

              <button
                className="primary"
                disabled={!solanaAddress || !amountValid || busy}
                onClick={handleBuy}
              >
                {busy ? 'Открываю оплату…' : `Купить ${TOKENS[token].label}`}
              </button>

              {error && <p className="error">{error}</p>}
              {notice && <p className="notice">{notice}</p>}

              <div className="row-actions">
                <button className="ghost small" onClick={refreshBalance}>
                  Обновить баланс
                </button>
                <button
                  className="ghost small"
                  onClick={() => exportWallet({address: solanaAddress})}
                >
                  Забрать приватный ключ
                </button>
              </div>

              <p className="fine">
                Приватный ключ можно импортировать в Phantom или Solflare — тогда кошелёк будет
                работать и без этого сайта. Никому его не показывай.
              </p>
            </>
          )}
        </section>

        <section className="steps">
          <div className="step">
            <span className="num">1</span>
            <h3>Вход</h3>
            <p>Почта. Кошелёк создаётся сам.</p>
          </div>
          <div className="step">
            <span className="num">2</span>
            <h3>Оплата</h3>
            <p>Карта, Apple Pay или Google Pay через Stripe.</p>
          </div>
          <div className="step">
            <span className="num">3</span>
            <h3>Готово</h3>
            <p>Монеты приходят на твой адрес в Solana.</p>
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

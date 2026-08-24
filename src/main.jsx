import {Buffer} from 'buffer';
import React from 'react';
import ReactDOM from 'react-dom/client';
import {PrivyProvider} from '@privy-io/react-auth';
import {toSolanaWalletConnectors} from '@privy-io/react-auth/solana';
import {createSolanaRpc, createSolanaRpcSubscriptions} from '@solana/kit';
import App from './App.jsx';
import './styles.css';

// полифиллы, которые ожидают solana-библиотеки в браузере
if (typeof window !== 'undefined') {
  window.Buffer = window.Buffer || Buffer;
  window.global = window.global || window;
}

// App ID публичный — его безопасно держать в коде фронтенда.
// App secret сюда класть НЕЛЬЗЯ никогда.
const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID || 'cmt74w3xj01tk0ci8a1epzvrz';

// Публичный RPC подходит для старта. Под нагрузкой замени на Helius / QuickNode.
const RPC_URL = import.meta.env.VITE_SOLANA_RPC || 'https://api.mainnet-beta.solana.com';
const RPC_WS = RPC_URL.replace(/^http/, 'ws');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ['email', 'google', 'wallet'],
        appearance: {
          theme: 'dark',
          accentColor: '#7c5cff',
          walletChainType: 'solana-only',
          logo: undefined
        },
        externalWallets: {
          solana: {connectors: toSolanaWalletConnectors()}
        },
        embeddedWallets: {
          solana: {createOnLogin: 'all-users'}
        },
        solana: {
          rpcs: {
            'solana:mainnet': {
              rpc: createSolanaRpc(RPC_URL),
              rpcSubscriptions: createSolanaRpcSubscriptions(RPC_WS)
            }
          }
        }
      }}
    >
      <App />
    </PrivyProvider>
  </React.StrictMode>
);

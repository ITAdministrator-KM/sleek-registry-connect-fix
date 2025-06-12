
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { componentTagger } from 'lovable-tagger';
import path from 'path';

import type { ConfigEnv, UserConfig } from 'vite';

export default ({ mode }: ConfigEnv): UserConfig => {
  const isProduction = mode === 'production';
  const env = loadEnv(mode, process.cwd(), '');

  return {
    define: {
      'process.env': { ...env, NODE_ENV: mode }
    },
    plugins: [
      react({
        babel: {
          plugins: ['@emotion/babel-plugin'],
        },
        jsxRuntime: 'automatic',
        ...(!isProduction && {
          fastRefresh: true,
        }),
      }),
      mode === 'development' && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 8080,
      open: true,
      hmr: {
        overlay: true,
      },
      // Fix for TrustedTypes policy error
      headers: {
        'Content-Security-Policy': "script-src 'self' 'unsafe-inline' 'unsafe-eval'; object-src 'none';"
      }
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@emotion/react',
        '@emotion/styled',
        'qrcode',
        'html5-qrcode'
      ],
      force: true,
    },
    build: {
      // Fix for TrustedTypes in production
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            utils: ['qrcode', 'html5-qrcode']
          }
        }
      }
    }
  };
};

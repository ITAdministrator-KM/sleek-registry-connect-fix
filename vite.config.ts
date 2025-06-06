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
        // Handle React 18's concurrent features
        jsxRuntime: 'automatic',
        // Enable React Refresh in development
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
      port: 3000,
      open: true,
      hmr: {
        overlay: true,
      },
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@emotion/react',
        '@emotion/styled',
      ],
      // Force dependency pre-bundling in dev
      force: true,
    },
    // Environment variables are already handled in the define block above
  };
};

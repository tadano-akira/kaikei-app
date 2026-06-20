import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages のリポジトリ名に合わせて base を変更してください
// 例: https://yourname.github.io/kaikei-app/ なら base: '/kaikei-app/'
export default defineConfig({
  base: '/kaikei-app/',
  plugins: [
    react(),
    VitePWA({
      selfDestroying: true,
      manifest: {
        name: 'ひとり帳',
        short_name: 'ひとり帳',
        description: 'フリーランス向け経費・売上・日常ツール管理アプリ',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
});

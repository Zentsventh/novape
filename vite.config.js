import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import viteCompression from 'vite-plugin-compression';

export default defineConfig({
    server: {
        watch: {
            ignored: ['**/storage/**', '**/database/seed-data/**', '**/public/storage/**'],
        },
    },
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.jsx'],
            refresh: true,
        }),
        react(),
        tailwindcss(),
        viteCompression({
            algorithm: 'brotliCompress',
            ext: '.br',
            threshold: 1024,
        }),
    ],
});

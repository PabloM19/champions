import {defineConfig} from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
import {libraryPlugin} from './server/library-plugin.ts';
export default defineConfig({plugins:[react(),tailwind(),libraryPlugin()],build:{chunkSizeWarningLimit:1000},test:{include:['tests/**/*.test.ts','tests/**/*.test.tsx','tests/**/*.test.mjs']}});

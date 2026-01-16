
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Vite já trata as variáveis VITE_ automaticamente, não é necessário o 'define process.env'
});

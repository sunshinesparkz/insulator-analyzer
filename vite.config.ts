import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  // Using '.' defaults to current working directory and avoids 'process' type issues
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    server: {
      port: 3000,
    },
    define: {
      // Map the system variable API_KEY (provided by AI Studio/Cloud) 
      // to the VITE_API_KEY expected by the frontend code.
      'import.meta.env.VITE_API_KEY': JSON.stringify(env.VITE_API_KEY || env.API_KEY),
    }
  };
});
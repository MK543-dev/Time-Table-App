import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

// In hosted preview environments (Google AI Studio), external proxies terminate SSL
// and do not proxy internal HMR WebSockets. This plugin ensures the Vite dev client
// does not attempt to open a failing WebSocket connection while preserving full SPA compilation.
function disableHmrClientPlugin(): Plugin {
  return {
    name: 'disable-hmr-client',
    apply: 'serve',
    transform(code, id) {
      if (id.includes('vite/dist/client/client.mjs')) {
        return code.replace(
          'transport.connect(createHMRHandler(handleMessage));',
          '/* [vite] HMR WebSocket connection disabled for hosted preview environment */'
        );
      }
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), disableHmrClientPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // Disable Vite internal HMR WebSocket server in container / hosted preview
      hmr: false as const,
      ws: false as const,
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), TanStackRouterVite()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),

      // fix loading all icon chunks in dev mode
      // https://github.com/tabler/tabler-icons/issues/1233
      '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs',
      
      // Fix React 19 compatibility by redirecting to our custom polyfill
      'use-sync-external-store/shim/with-selector': path.resolve(__dirname, './src/polyfills.ts'),
      'use-sync-external-store/shim/with-selector.js': path.resolve(__dirname, './src/polyfills.ts'),
    },
  },
  define: {
    // Fix for useSyncExternalStoreWithSelector compatibility with React 19
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    // Define global for React 19 compatibility
    global: 'globalThis',
  },
  optimizeDeps: {
    exclude: [
      '@tanstack/react-router',
      '@tanstack/react-query',
      '@tanstack/react-table',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-toast',
      '@radix-ui/react-tooltip'
    ],
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'jsesc',
      'recharts',
      'lucide-react',
      'lodash/get',
      'lodash/isString',
      'lodash/isNaN',
      'lodash/isNumber'
    ]
  },
  // Add server proxy configuration
  server: {
    proxy: {
      // Proxy requests starting with /api to target server (e.g., running on port 3001)
      '/api': {
        target: 'http://localhost:3001', // Target where the API functions run
        changeOrigin: true, // Recommended for virtual hosted sites
        // Optional: You might rewrite the path if needed, but often not necessary
        // rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})

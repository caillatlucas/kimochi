import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  // Base URL pour GitHub Pages (chemins relatifs)
  base: '/',
  // Dossier racine du projet (là où se trouve index.html)
  root: './',

  // Serveur de développement
  server: {
    port: 5173,
    open: true,
    host: 'localhost',
    watch: {
      // Exclut les fichiers verrouillés par Windows (EBUSY)
      ignored: [
        '**/KIMOCHI (1).svg',
        '**/KIMOCHI (1).png',
        '**/.git/**',
        '**/node_modules/**',
      ],
    },
  },

  // Build de production
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsInlineLimit: 4096,
    rollupOptions: {
      input: './index.html',
    },
  },

  // Prévisualisation du build
  preview: {
    port: 4173,
    open: true,
  },
})

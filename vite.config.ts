import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' keeps asset URLs relative so the app works under a GitHub Pages
// subpath (https://<user>.github.io/<repo>/) as well as at a domain root.
export default defineConfig({
  base: './',
  plugins: [react()],
})

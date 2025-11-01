import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/Mo.github.io/'   // vervang <repo-naam> door je echte GitHub-repo
})
//fixed deployment issue with gh pages by adding base property
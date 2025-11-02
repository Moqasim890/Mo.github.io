import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/Mo.github.io/' // Update this to match your repository name
})
//fixed deployment issue with gh pages by adding base property
//https://vitejs.dev/guide/static-deploy.html#github-pages
//also make sure to set "homepage" in package.json to "https://<your-github-username>.github.io/<repo-name>/"Q
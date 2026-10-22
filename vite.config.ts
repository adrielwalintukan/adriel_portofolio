import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// Serves api/*.ts on the dev server the way Vercel does in production (Web Request -> Response)
function devApi(): Plugin {
  return {
    name: 'dev-api',
    apply: 'serve',
    configureServer(server) {
      Object.assign(process.env, loadEnv('development', process.cwd(), '')) // GEMINI_API_KEY from .env.local
      server.middlewares.use('/api/', async (req, res) => {
        const mod = await server.ssrLoadModule(`/api${req.url?.split('?')[0]}.ts`).catch(() => null)
        const handler = mod?.[req.method ?? 'GET']
        if (!handler) return void res.writeHead(404).end()
        const chunks: Buffer[] = []
        for await (const c of req) chunks.push(c as Buffer)
        const response: Response = await handler(
          new Request(`http://localhost${req.originalUrl}`, {
            method: req.method,
            headers: req.headers as Record<string, string>,
            body: chunks.length ? Buffer.concat(chunks) : undefined,
          })
        )
        res.writeHead(response.status, Object.fromEntries(response.headers)).end(await response.text())
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), devApi()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
})

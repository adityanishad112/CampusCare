import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: "react-vendor", test: /node_modules\/(react|react-dom|react-router)/ },
            { name: "chart-vendor", test: /node_modules\/recharts/ },
            { name: "icon-vendor", test: /node_modules\/lucide-react/ },
          ],
        },
      },
    },
  },
})

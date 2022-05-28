const { resolve } = require('path')
const { defineConfig } = require('vite')

// https://vitejs.dev/config/
module.exports = defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      }
    }
  }
})

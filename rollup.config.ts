import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'

const pkg = require('./package.json')

export default {
  input: `src/index.ts`,
  output: [
    { file: pkg.main, name: 'blueprinter', format: 'umd', sourcemap: true },
    { file: pkg.module, format: 'es', sourcemap: true },
  ],
  external: [],
  watch: {
    include: 'src/**',
  },
  plugins: [typescript(), commonjs()],
}

import typescript from '@wessberg/rollup-plugin-ts'
import { terser } from 'rollup-plugin-terser'

const dev = process.env.ROLLUP_WATCH

export default {
  input: 'src/index.ts',
  output: {
    format: 'esm',
    file: 'dist/bundle.js'
  },
  plugins: [
    typescript(),
    !dev && terser(),
  ],
  watch: {
    clearScreen: false,
  },
}

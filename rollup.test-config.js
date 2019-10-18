import typescript from '@wessberg/rollup-plugin-ts'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import { compilerOptions } from './tsconfig.json'

compilerOptions.declaration = false

export default {
  input: 'test/index.ts',
  output: {
    format: 'umd',
    file: 'test/bundle.js'
  },
  plugins: [
    resolve(),
    commonjs({
      namedExports: {
        chai: ['assert'],
      },
    }),
    typescript({ tsconfig: compilerOptions }),
  ],
  watch: {
    clearScreen: false,
  },
  // suppress `circular dependency` warnings
  onwarn(warning, rollupWarn) {
    if (warning.code !== 'CIRCULAR_DEPENDENCY') rollupWarn(warning)
  }
}

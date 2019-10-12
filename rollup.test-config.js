import typescript from 'rollup-plugin-typescript2'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'

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
    typescript(),
  ],
  watch: {
    clearScreen: false,
  },
  // suppress `circular dependency` warnings
  onwarn(warning, rollupWarn) {
    if (warning.code !== 'CIRCULAR_DEPENDENCY') rollupWarn(warning)
  }
}

import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'index.ts',
  output: {
    sourcemap: true,
    format: 'esm',
    file: 'dist/bundle.js'
  },
  plugins: [
    terser(),
    typescript(),
  ],
  watch: {
    clearScreen: false,
  },
};

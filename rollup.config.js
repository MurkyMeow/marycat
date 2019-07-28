import { terser } from 'rollup-plugin-terser';

export default {
  input: 'index.js',
  output: {
    sourcemap: true,
    format: 'esm',
    file: 'dist/bundle.js'
  },
  plugins: [
    terser(),
  ],
  watch: {
    clearScreen: false,
  },
};

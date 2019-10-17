import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';

const dev = process.env.ROLLUP_WATCH;

export default {
  input: 'src/index.ts',
  output: {
    sourcemap: true,
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
};

import terser from '@rollup/plugin-terser';

// Custom plugin to prefix the output with "javascript:"
const javascriptPrefix = () => {
  return {
    name: 'javascript-prefix',
    generateBundle(outputOptions, bundle) {
      const fileName = Object.keys(bundle)[0];
      const file = bundle[fileName];
      file.code = `javascript:${file.code}`;
    }
  };
};

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/bookmarklet.js',
    format: 'iife',
    compact: true
  },
  plugins: [
    terser(),
    javascriptPrefix()
  ]
};

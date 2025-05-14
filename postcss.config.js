// postcss.config.js
module.exports = {
  plugins: {
    'postcss-import': {},
    'postcss-preset-env': {
      stage: 2, // A good default, includes nesting and other modern features
      features: {
        'nesting-rules': true, // Explicitly enable nesting
      },
    },
  },
};
    
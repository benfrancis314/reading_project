const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: './content_script.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  module : {
	 rules: [{
	    'test': /lib\/.*\.js$/,
      'exclude': /node_modules/,
      'use': {
          'loader': 'babel-loader',
          'options': {
            'presets': [
              '@babel/preset-env'
            ],
          }
        }
	 }]
  },
  mode: process.env.NODE_ENV || 'development',
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin({
      sourceMap: true,
      terserOptions: {
        mangle: true,
        output: {
          comments: false,
        },
      },
      extractComments: false,
    }),]
  }
};
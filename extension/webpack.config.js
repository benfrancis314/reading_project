const path = require('path');

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
  }
};
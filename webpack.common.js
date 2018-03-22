const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
  entry: './src/index.tsx',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json', '.png', '.svg', '.jpg', '.gif'],
  },
  module: {
    rules: [
      {test: /\.tsx?$/, loader: 'awesome-typescript-loader'},
      {enforce: 'pre', test: /\.js$/, loader: 'source-map-loader'},
      {enforce: 'pre', test: /\.(png|svg|jpg|gif)$/, loader: 'file-loader'},
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'heyo',
      template: 'src/index.html',
    }),
    new CleanWebpackPlugin(['dist']),
  ],
};
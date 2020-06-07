const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WasmPackPlugin = require('@wasm-tool/wasm-pack-plugin');
const webpack = require('webpack');

module.exports = {
  entry: {
    app: './src/bootstrap.ts',
  },
  output: {
    filename: '[name].bundle.js',
    chunkFilename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    extensions: [
      '.ts',
      '.tsx',
      '.js',
      '.json',
      '.png',
      '.svg',
      '.jpg',
      '.gif',
      '.glsl',
    ],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: '/node_modules/',
        loader: 'ts-loader',
      },
      {
        enforce: 'pre',
        test: /\.js$/,
        exclude: '/node_modules/',
        loader: 'source-map-loader',
      },
      {
        enforce: 'pre',
        exclude: '/node_modules/',
        test: /\.(png|svg|jpg|gif)$/,
        loader: 'file-loader',
      },
      {
        test: /\.css$/,
        exclude: '/node_modules/',
        use: ['style-loader', 'css-loader'],
      },
      {
        enforce: 'pre',
        exclude: '/node_modules/',
        test: /\.glsl$/,
        use: 'raw-loader',
      },
      {
        test: /\.worker\.js$/,
        use: {loader: 'worker-loader'},
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Zephrly',
      template: 'src/index.html',
    }),
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    new WasmPackPlugin({
      crateDirectory: __dirname,
      outDir: path.resolve(__dirname, 'rust_pkg'),
      watchDirectories: [path.resolve(__dirname, 'rust_src')],
    }),
  ],
  optimization: {
    splitChunks: {
      chunks: 'all',
    },
  },
};

const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = (env, argv) => ({
  mode: argv.mode === 'production' ? 'production' : 'development',
  
  // This is the main entry point for the plugin
  entry: {
    ui: './src/ui.ts',
    code: './src/code.ts',
  },
  
  module: {
    rules: [
      // Handle TypeScript files
      { 
        test: /\.tsx?$/, 
        use: 'ts-loader', 
        exclude: /node_modules/ 
      },
      // Handle CSS files
      { 
        test: /\.css$/, 
        use: ['style-loader', 'css-loader']
      },
      // Handle images and other assets
      { 
        test: /\.(png|jpg|gif|webp|svg)$/, 
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8192,
              name: '[name].[ext]',
              outputPath: 'assets/'
            }
          }
        ]
      },
    ],
  },
  
  // Configure webpack to understand TypeScript file extensions
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  
  // Generate HTML files
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/ui.html',
      filename: 'ui.html',
      chunks: ['ui'],
      inject: 'body',
    })
  ],
  
  // Development settings
  ...(argv.mode === 'development' && {
    devtool: 'inline-source-map',
  })
});
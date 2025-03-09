const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const fs = require('fs');

module.exports = (env, argv) => {
  const isDevelopment = argv.mode !== 'production';
  
  // Custom plugin to inline the UI JavaScript and remove ui.js file
  class InlineUIScriptPlugin {
    apply(compiler) {
      compiler.hooks.done.tap('InlineUIScriptPlugin', stats => {
        const outputPath = stats.compilation.outputOptions.path;
        const htmlFile = path.join(outputPath, 'ui.html');
        const jsFile = path.join(outputPath, 'ui.js');
        
        if (fs.existsSync(htmlFile) && fs.existsSync(jsFile)) {
          let html = fs.readFileSync(htmlFile, 'utf8');
          const js = fs.readFileSync(jsFile, 'utf8');
          
          // Replace the script tag with an inline script
          html = html.replace(
            /<script.*src=["']ui\.js["'].*><\/script>/,
            `<script>${js}</script>`
          );
          
          fs.writeFileSync(htmlFile, html);
          fs.unlinkSync(jsFile); // Remove the external JS file
        }
      });
    }
  }
  
  // Custom plugin to copy debug helper to the output directory (development only)
  class CopyDebugHelperPlugin {
    apply(compiler) {
      compiler.hooks.done.tap('CopyDebugHelperPlugin', stats => {
        // Only copy debug helper in development mode
        if (isDevelopment) {
          const outputPath = stats.compilation.outputOptions.path;
          const debugHelperFile = path.join(__dirname, 'src/ui/debug-helpers.js');
          const outputFile = path.join(outputPath, 'debug-helpers.js');
          
          if (fs.existsSync(debugHelperFile)) {
            const debugHelperContent = fs.readFileSync(debugHelperFile, 'utf8');
            fs.writeFileSync(outputFile, debugHelperContent);
            console.log('Debug helper copied to output directory (development only)');
          }
        }
      });
    }
  }
  
  return {
    mode: isDevelopment ? 'development' : 'production',
    
    // Entry points for plugin code and UI
    entry: {
      ui: './src/ui/index.ts',
      code: './src/code/index.ts',
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
    
    // Configure webpack to understand TypeScript file extensions and path aliases
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      alias: {
        '@ui': path.resolve(__dirname, 'src/ui'),
        '@code': path.resolve(__dirname, 'src/code'),
        '@components': path.resolve(__dirname, 'src/ui/components'),
        '@utilities': path.resolve(__dirname, 'src/ui/utilities')
      }
    },
    
    output: {
      filename: '[name].js',
      path: path.resolve(__dirname, 'dist'),
    },
    
    // Generate HTML files and inline UI JavaScript
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/ui.html',
        filename: 'ui.html',
        chunks: ['ui'],
        inject: 'body',
        mode: isDevelopment ? 'development' : 'production'
      }),
      new InlineUIScriptPlugin(),
      new CopyDebugHelperPlugin() // Will only copy in development mode
    ],
    
    // Development settings
    ...(isDevelopment && {
      devtool: 'inline-source-map',
    })
  };
};
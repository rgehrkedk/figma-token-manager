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
          
          // Instead of using string replacement, create a proper structure
          // First, find the end of the body tag
          const bodyEndIndex = html.lastIndexOf('</body>');
          
          if (bodyEndIndex !== -1) {
            // Split the HTML at the body end
            const beforeBody = html.substring(0, bodyEndIndex);
            const afterBody = html.substring(bodyEndIndex);
            
            // Create a new HTML with the inlined script
            html = beforeBody + `<script>\n${js}\n</script>\n` + afterBody;
          } else {
            // Fallback if body end tag not found
            html = html.replace(
              /<script.*src=["']ui\.js["'].*><\/script>/,
              `<script>\n${js}\n</script>`
            );
          }
          
          // Extra optimization: Look for any remaining CSS files and inline them too
          const linkCssRegex = /<link.*href=["'](.+\.css)["'].*>/g;
          let match;
          
          while ((match = linkCssRegex.exec(html)) !== null) {
            const cssFileName = match[1];
            const cssFilePath = path.join(outputPath, cssFileName);
            
            if (fs.existsSync(cssFilePath)) {
              const cssContent = fs.readFileSync(cssFilePath, 'utf8');
              html = html.replace(
                match[0],
                `<style>\n${cssContent}\n</style>`
              );
              // Optionally remove the CSS file if we're inlining it
              fs.unlinkSync(cssFilePath);
            }
          }
          
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
const path = require('path');

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: path.resolve(__dirname, "src/main"),
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
    publicPath: '/',
	
	clean:true,
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.glsl$/,
        loader: 'webpack-glsl-loader'
      },
{
        test: /\.(png|jpe?g|gif|svg)$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[path][name].[ext]',
              type: 'asset/resource',
              generator: {
                filename: 'textures/[name][ext]' // This will output to textures/ instead of textures/src/textures/
              }
            },
          },
        ],
      },
    ]
  },
  resolve: {
    extensions: ['.ts', '.js' ],
  },
  devtool: 'source-map',
  devServer: {
    port: 5660,
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    client: {
      overlay: true,
    }
  },
};

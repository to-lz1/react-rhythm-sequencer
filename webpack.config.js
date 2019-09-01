module.exports = {
  mode: 'development',
  entry: {
    main: './src/rhythmSequencer.jsx',
    worker: './src/timerWorker.js'
  },
  output: {
    path: __dirname + '/public/scripts/build',
    filename: '[name].js'
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          cacheDirectory: true,
          presets: [
            "@babel/preset-env",
            "@babel/react"
          ]
        }
      },
      {
        test: /\.css$/,
        loaders: ['style-loader', 'css-loader?modules'],
      },
    ]
  }
}
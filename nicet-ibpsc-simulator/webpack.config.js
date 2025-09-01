const path = require("path");

module.exports = {
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "build"),
    filename: "bundle.js",
    publicPath: "/",
  },
  module: {
    rules: [
      { test: /\.js$/, exclude: /node_modules/, use: { loader: "babel-loader" } },
      { test: /\.css$/, use: ["style-loader","css-loader"] },
    ],
  },
  resolve: { extensions: [".js"] },
  devServer: {
    static: path.join(__dirname, "public"),
    compress: true,
    port: 3000,
    historyApiFallback: true,
    open: true
  }
};

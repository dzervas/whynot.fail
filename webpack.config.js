const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
	entry: "./index.js",
	output: {
		path: path.join(__dirname, "/bundle"),
		filename: "index_bundle.js"
	},
	devServer: {
		inline: true,
		port: 3000,
		historyApiFallback: {
			index: 'index.html'
		}
	},
	module: {
		rules: [
			{
				test: /\.jsx?$/,
				exclude: /node_modules/,
				loader: "babel-loader",
				options: {
					presets: ["@babel/preset-env"],
					presets: ["@babel/preset-react"]
				}
			},{
				test: /\.css$/i,
				use: ['style-loader', 'css-loader'],
			},{
				test: /\.(ico|png|svg|jpg|jpeg|gif)$/i,
				// type: 'asset/resource',
				loader: 'file-loader',
				options: {
					name: '[name].[ext]'
				}
			},
		]
	},
	plugins:[
		new HtmlWebpackPlugin({
			template: "./index.html"
		})
	]
}

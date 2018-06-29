const path = require('path');
const webpack = require('webpack');
const exec = require('child_process').execFile;
//const HtmlWebpackPlugin = require('html-webpack-plugin');

const browserConfig = {
    entry : [
        'babel-polyfill',
        './src/thymio_blockly.js',
        './src/blockly_override.js'
    ],
    output: {
        filename: 'thymio_blockly.js',
        path: __dirname + "/thymio_blockly/js/",
        publicPath: "js/"
    },
    devtool: 'sourcemap',
    mode: 'development',
    devServer: {
        hot : true,
        overlay: true,
        watchContentBase: true
    },
    module: {
        rules: [
//             {
//                 enforce: "pre",
//                 test: /\/src\/.*\.js$/,
//                 exclude: /node_modules/,
//                 loader: "eslint-loader",
//             },
            {
                test:  /\/src\/.*\.js$/,
                loader: 'babel-loader',
                options: {
                    presets: ['env']
                },
                exclude: /node_modules/
            }
        ]
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
        new webpack.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery"
        })
    ]
};

module.exports = [ browserConfig ];

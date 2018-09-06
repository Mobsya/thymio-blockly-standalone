const webpack = require('webpack');
const babelenv = require('babel-preset-env');

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
//         /*rules: [
//             {
//                 test:  /\/src\/.*\.js$/,
//                 loader: 'babel-loader',
//                 exclude: /(node_modules\/babel-polyfill)/,
//                 options: {
//                     presets: [
//                         [
//                             babelenv , {
//                                 "targets": {
//                                     "browsers": ["> 3%", "ie >= 10"]
//                                 }
//                             }
//                         ]
//                     ]
//                 }
//             }
//         ]*/
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

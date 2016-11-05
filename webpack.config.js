var path = require('path');
var webpack = require('webpack');

module.exports = {
    entry: {
        block_components: './builder/static/js/components/block_components'
    },
    output: {
        path: path.join(__dirname, "static/js"),
        filename: "[name].js"
    },
    resolve: {
        extensions: ['', '.js', '.jsx']
    },
    module: {
        loaders: [
            {
                test: /.jsx?$/,
                loader: 'babel-loader',
                exclude: /node_modules/,
                query: {
                    presets: ['es2015', 'es2015-loose', 'stage-0', 'react']
                }
            }
        ]
    }
};

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { HotModuleReplacementPlugin, EnvironmentPlugin } = require('webpack');
const Dotenv = require('dotenv-webpack');
const { GitRevisionPlugin } = require('git-revision-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
// const WebpackPwaManifest = require('webpack-pwa-manifest');
const { merge } = require('webpack-merge');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerWebpackPlugin = require('css-minimizer-webpack-plugin');
const StyleLintPlugin = require('stylelint-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
// const WorkboxWebpackPlugin = require('workbox-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const ResourceHintWebpackPlugin = require('resource-hints-webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

const pkg = require('./package.json');

function getPath(value) {
    return path.resolve(__dirname, value);
}

const gitRevisionPlugin = new GitRevisionPlugin();

const isProduction = process.env.NODE_ENV === 'production';

module.exports = () => {
    const config = {
        // TODO: define context
        mode: isProduction
            ? 'production'
            : 'development',
        devtool: isProduction
            ? 'source-map'
            : 'eval-cheap-source-map', // false
        entry: getPath('app/index.tsx'),
        node: false,
        resolve: {
            extensions: ['.js', '.jsx', '.ts', '.tsx'],
            symlinks: false,
        },
        output: {
            path: getPath('build/'),
            // NOTE: 'auto' resolves chunk and asset URLs from the URL of the
            // script that loaded the runtime. An embedding page serves the
            // bundle from another origin than its own, so a fixed '/' would
            // send every lazy chunk and emitted asset to the embedder's root.
            publicPath: 'auto',
            sourceMapFilename: '[file].map',
            chunkFilename: 'js/[name].[contenthash].chunk.js',
            filename: 'js/[name].bundle.js',
            assetModuleFilename: 'assets/[name].[contenthash][ext]',
            clean: true,
        },
        module: {
            rules: [
                {
                    test: /\.[tj]sx?$/,
                    include: getPath('app/'),
                    exclude: /node_modules/,
                    loader: 'babel-loader',
                    options: {
                        plugins: [
                            !isProduction && require.resolve('react-refresh/babel'),
                        ].filter(Boolean),
                    },
                },
                {
                    test: /\.css$/,
                    include: getPath('app/'),
                    exclude: /node_modules/,
                    use: [
                        isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
                        {
                            loader: 'css-loader',
                            options: {
                                importLoaders: 1,
                                modules: {
                                    localIdentName: '[name]_[local]_[hash:base64:5]',
                                    exportLocalsConvention: 'camelCaseOnly',
                                },
                                esModule: true,
                                sourceMap: true,
                            },
                        },
                        {
                            loader: 'postcss-loader',
                            ident: 'postcss',
                            options: {
                                sourceMap: true,
                            },
                        },
                    ],
                },
                {
                    test: /\.css$/,
                    include: getPath('node_modules/'),
                    sideEffects: true,
                    use: [
                        isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
                        'css-loader',
                    ],
                },
                {
                    test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
                    exclude: /(node_modules)/,
                    include: getPath('app/'),
                    // NOTE: only the small icons are worth a data URI. Base64
                    // inflates a file by a third and defeats gzip on anything
                    // already compressed, and an inlined asset can never be
                    // cached or fetched separately from the bundle.
                    type: 'asset',
                    parser: {
                        dataUrlCondition: {
                            maxSize: 4 * 1024,
                        },
                    },
                },
            ],
        },
        plugins: [
            new EnvironmentPlugin({
                MY_APP_ID: pkg.name,
                MY_APP_NAME: pkg.longName,
                // MY_APP_DESCRIPTION: pkg.description,

                REACT_APP_VERSION: gitRevisionPlugin.version(),
                REACT_APP_COMMITHASH: gitRevisionPlugin.commithash(),
                REACT_APP_BRANCH: gitRevisionPlugin.branch(),
            }),
            new Dotenv({
                safe: true,
                expand: true,
                allowEmptyValues: true,
                defaults: false,
                path: getPath('.env'),
                systemvars: !!isProduction, // NOTE: need to filter system variables
            }),
            new MiniCssExtractPlugin({
                // NOTE: `main.css` keeps its plain name -- an embedding page links
                // to it by hand. The lazy chunks are resolved by the runtime, so
                // they can carry a hash and be cached indefinitely.
                filename: 'css/[name].css',
                chunkFilename: isProduction
                    ? 'css/[id].[contenthash].css'
                    : 'css/[id].css',
            }),
            new CopyPlugin({
                patterns: [
                    { from: 'public', to: '.' },
                ],
            }),
            new HtmlWebpackPlugin({
                favicon: getPath('app/favicon.ico'),
                template: getPath('app/index.html'),
                filename: 'index.html',
                title: pkg.name,
                // NOTE: we do not need to use this html on production
                minify: false,
                meta: {
                    viewport: 'width=device-width, initial-scale=1.0',
                    description: pkg.description,
                    referrer: 'origin',
                },
            }),
            /*
            new WebpackPwaManifest({
                name: pkg.name,
                short_name: pkg.name,
                description: pkg.description,
                orientation: 'landscape',
                // background_color: '#f0f0f0',
                // theme_color: '#303f9f',
                display: 'standalone',
                start_url: '/',
                scope: '/',
                icons: [
                    {
                        src: getPath('app/favicon.png'),
                        sizes: [96, 128, 192, 256, 384, 512],
                        destination: 'icons',
                    },
                ],
            }),
            */
            new CircularDependencyPlugin({
                exclude: /node_modules/,
                failOnError: false,
                allowAsyncCycles: false,
                cwd: __dirname,
            }),
            new StyleLintPlugin({
                files: ['**/*.css'],
                context: getPath('app/'),
            }),
            new ESLintPlugin({
                extensions: ['.js', '.jsx', '.ts', '.tsx'],
                reportUnusedDisableDirectives: 'warn',
            }),
        ],
    };

    if (isProduction) {
        return merge(
            config,
            {
                performance: {
                    hints: 'warning',
                },
                optimization: {
                    moduleIds: 'deterministic', // 'hashed',
                    runtimeChunk: 'single',
                    minimizer: [
                        // NOTE: Using TerserPlugin instead of UglifyJsPlugin
                        // as es6 support deprecated
                        new TerserPlugin({
                            parallel: true,
                            terserOptions: {
                                mangle: true,
                                compress: { typeofs: false },
                            },
                        }),
                        new CssMinimizerWebpackPlugin(),
                    ],
                    splitChunks: {
                        // NOTE: 'async' only. An embedding page loads exactly the
                        // two script tags it was given, so anything split out of
                        // the initial chunk would simply never be fetched; every
                        // extra chunk has to be one the runtime pulls in itself.
                        chunks: 'async',
                        minSize: 30 * 1024,
                        cacheGroups: {
                            // The map stack is the single largest dependency and
                            // only three of the nine pages touch it.
                            mapbox: {
                                test: /[\\/]node_modules[\\/](mapbox-gl|@mapbox[\\/]mapbox-gl-draw)[\\/]/,
                                name: 'mapbox',
                                priority: 30,
                                reuseExistingChunk: true,
                            },
                            charts: {
                                test: /[\\/]node_modules[\\/](recharts|recharts-scale|react-smooth|d3-.*|decimal.js-light|reduce-css-calc|victory-vendor)[\\/]/,
                                name: 'charts',
                                priority: 20,
                                reuseExistingChunk: true,
                            },
                            // NOTE: no `name`. Naming this group would merge every
                            // lazy dependency into one chunk, so a page that
                            // wants the editor would also fetch the spreadsheet
                            // writer. Unnamed, webpack groups by which pages
                            // actually share a module.
                            vendors: {
                                test: /[\\/]node_modules[\\/]/,
                                priority: 10,
                                reuseExistingChunk: true,
                            },
                        },
                    },
                },
                plugins: [
                    new ResourceHintWebpackPlugin(),
                    new CompressionPlugin(),
                    /*
                    new WorkboxWebpackPlugin.GenerateSW({
                        // these options encourage the ServiceWorkers to get in there fast
                        // and not allow any straggling "old" SWs to hang around
                        cleanupOutdatedCaches: true,
                        clientsClaim: true,
                        skipWaiting: true,
                        include: [/\.html$/, /\.js$/, /\.css$/],
                        navigateFallback: '/index.html',
                        navigateFallbackDenylist: [/^\/icons/, /^\/assets/, /^\/api/, /^\/graphql/, /^\/graphiql/],
                        maximumFileSizeToCacheInBytes: 500 * 1024,
                        runtimeCaching: [
                            {
                                urlPattern: /assets/,
                                handler: 'StaleWhileRevalidate',
                            },
                        ],
                        exclude: [/\.map$/, /\.map.gz$/, /index.html/, /index.html.gz/],
                    }),
                    */
                ],
            },
        );
    }

    return merge(
        config,
        {
            /*
            optimization: {
                usedExports: true,
                innerGraph: true,
                sideEffects: true,
            },
            */
            devServer: {
                host: '0.0.0.0',
                port: 3081,
                overlay: true,
                hot: true,
                liveReload: false,
                historyApiFallback: true,
                watchContentBase: true,
                watchOptions: {
                    ignored: /node_modules/,
                },
                headers: {
                    'Document-Policy': 'js-profiling',
                },

                clientLogLevel: 'none',
                publicPath: '/',
            },
            plugins: [
                new HotModuleReplacementPlugin(),
                new ReactRefreshWebpackPlugin(),
            ],
            /*
            // TODO: enable this later
            experiments: {
                lazyCompilation: true,
            },
            */
        },
    );
};

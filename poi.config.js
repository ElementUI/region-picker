var CDN = require('webpack-cdn-plugin')
var path = require('path')

module.exports = ({ mode }) => ({
  entry: './src/docs/index.js',
  dist: 'docs',
  homepage: '/region-picker/',
  extendWebpack(config) {
    const isProd = mode === 'production'

    config.resolve.alias.set('region-picker', path.join(__dirname, '.'))

    config.plugin('webpack-cdn-plugin').use(CDN, [
      {
        modules: [
          {
            name: 'vue',
            var: 'Vue',
            path: isProd ? 'dist/vue.runtime.min.js' : 'dist/vue.runtime.js'
          }
        ],
        prodUrl: '//cdn.jsdelivr.net/npm/:name@:version/:path',
        publicPath: '/node_modules',
        prod: isProd
      }
    ])
  }
})

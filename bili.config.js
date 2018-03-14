module.exports = {
  name: 'region-picker',
  moduleName: 'Region-Picker',
  banner: true,
  format: ['umd', 'umd-min', 'cjs', 'cjs-min', 'es', 'es-min'],
  global: {
    vue: 'Vue'
  },
  external: ['vue'],
  plugin: [require('rollup-plugin-vue')({})],
  extract: false
}

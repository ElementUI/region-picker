import RegionPicker from './components/region-picker'
import './components/icon.css'

RegionPicker.install = function (Vue) {
  Vue.component(RegionPicker.name, RegionPicker)
}

export default RegionPicker

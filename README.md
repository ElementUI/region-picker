# region-picker
[![Build Status](https://travis-ci.org/ElementUI/region-picker.svg?branch=master)](https://travis-ci.org/ElementUI/region-picker)
[![npm](https://img.shields.io/npm/v/region-picker.svg)](https://www.npmjs.com/package/region-picker)
[![NPM downloads](https://img.shields.io/npm/dm/region-picker.svg?style=flat-square)](https://npmjs.com/package/region-picker)
[![LICENSE](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](https://github.com/ElementUI/region-picker/blob/master/LICENSE)
> A region picker based on Vue and ElementUI.

## Demo
[Region Picker](https://elementui.github.io/region-picker/)

## Installation
```bash
yarn add region-picker
# npm i region-picker -S
```

## Usage
```javascript
import RegionPicker from 'region-picker'
import data from 'region-picker/data.json'

Vue.use(RegionPicker)
// or
Vue.component(RegionPicker.name, RegionPicker)
```

```html
<!-- Single -->
<region-picker :data="data"></region-picker>

<!-- Multiple -->
<region-picker multiple :data="data"></region-picker>

<!-- Two Level -->
<region-picker :max-level="2" :data="data"></region-picker>

<!-- Disabled -->
<region-picker disabled :data="data"></region-picker>

<!-- Default Value -->
<region-picker v-model="place" :data="data"></region-picker>
```

## License
MIT

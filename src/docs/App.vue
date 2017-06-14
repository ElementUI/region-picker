<template lang="pug">
  main.content
    h2 RegionPicker 行政区选择器
    p 用于选择行政区

    h3 单选
    region-picker(:data="data")

    h3 多选
    region-picker(multiple, :data="data")

    h3 占位符
    region-picker(:data="data", placeholder="请选择城市")

    h3 二级
    region-picker(:max-level=2, :data="data")

    h3 禁用
    region-picker(disabled, :data="data")

    h3 单选默认值
    region-picker(v-model="singlePlace", :data="data")

    h3 多选默认值
    region-picker(v-model="multiplePlace", multiple, :data="data")

    h3 无城市数据
    region-picker

    h3 异步数据加载
    region-picker(v-model="defferedPlace", :data="defferedData")
</template>

<script>
import RegionPicker from '../index';
import data from '../components/data';

export default {
  name: 'app',
  components: {
    RegionPicker,
  },
  data() {
    return {
      data,
      defferedData: {},
      singlePlace: '310107',
      multiplePlace: ['310101', '310104', '310105', '310106', '310109', '310110', '310112', '310113', '310114', '310115', '310116', '310117', '310118', '310120', '310151'],
      defferedPlace: '310107'
    }
  },
  mounted() {
    setTimeout(() => this.defferedData= data, 3000);
  }
};
</script>

<style lang="stylus">
body
  font-family Helvetica Neue,Helvetica,PingFang SC,Hiragino Sans GB,Microsoft YaHei,SimSun,sans-serif
  overflow auto
  font-weight 400
  -webkit-font-smoothing antialiased
  color: #1f2f3d
  padding 20px 20px 100px
h2
h3
  font-weight 400
h3
  margin 45px 0 15px
p
  font-size 14px
</style>

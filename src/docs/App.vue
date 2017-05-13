<template lang="pug">
  div.row
    div.col
      label 单选二级
      region-picker(:max-level="2")
    div.col
      label 单选三级
      region-picker
    div.col
      label 多选二级
      region-picker(:max-level="2", multiple)
    div.col
      label 多选三级
      region-picker(multiple)
</template>

<script>
import RegionPicker from '../index';

export default {
  name: 'app',
  components: {
    RegionPicker,
  }
};
</script>

<style lang="stylus">
.row
  padding 20px
  .col
    padding 10px
    .region-picker
      margin-top 10px
</style>

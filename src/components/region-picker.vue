<template lang="pug">
.region-picker
  multiple(
      v-if="multiple"
      v-bind="$props"
      @input="propagateInput"
      :map="MAP"
      :flatten-map="FLATTEN_MAP"
    )
  single(
      v-else
      v-bind="$props"
      @input="propagateInput"
      :map="MAP"
      :flatten-map="FLATTEN_MAP"
    )
</template>

<script>
import Single from './single.vue';
import Multiple from './multiple.vue';
import './icon.css';

function createMap(country) {
  const FLATTEN_MAP = [];
  function transfer(sources) {
    if (!sources) {
      sources = [];
    }
    const map = {};

    sources.forEach((source) => {
      const { adcode, name, districts } = source;
      map[adcode] = {
        adcode,
        name,
        districts,
      };
    });

    return map;
  }

  function updateChildrenLength(object) {
    if (!object) {
      return;
    }
    updateChildrenLength(object.parent);
    object.surplus++;
    object.childrenLength++;
  }

  function traverse(object, level) {
    if (!object) {
      return null;
    }

    const districts = transfer(object.districts);
    object.districts = districts;

    const keys = Object.keys(districts);
    // 子元素未被选中的数量
    object.surplus = 0;
    if (!keys.length) {
      object.districts = null;
      object.surplus = 1;
      updateChildrenLength(object.parent);
    }
    object.childrenLength = object.surplus;

    keys.forEach((key) => {
      let district = districts[key];
      district.parent = object;
      if (object.fullName) {
        district.fullName = `${object.fullName} / ${district.name}`;
      } else {
        district.fullName = district.name;
      }
      FLATTEN_MAP.push({
        fullName: district.fullName,
        place: district,
      });
      // 子元素未被选中的数量
      district = traverse(district, level + 1);
    });

    object.level = level;

    return object;
  }

  const MAP = traverse(country, 0);
  return {
    MAP,
    FLATTEN_MAP,
  }
}

export default {
  name: 'region-picker',

  components: {
    Single,
    Multiple,
  },

  props: {
    // v-model
    value: {
      type: [
        String,
        Array,
      ],
    },

    // 是否多选
    multiple: {
      type: Boolean,
      default: false,
    },

    // 城市数据
    data: {
      type: Object,
      default: () => {},
    },

    maxLevel: {
      type: Number,
      default: 3,
    },

    disabled: {
      type: Boolean,
      default: false,
    },

    placeholder: {
      type: String,
    },
  },

  data() {
    return {
      MAP: {},
      FLATTEN_MAP: [],
    };
  },

  watch: {
    data: {
      handler(val) {
        if (val && Object.keys(val).length) {
          const result = createMap(JSON.parse(JSON.stringify(this.data)));
          this.MAP = result.MAP;
          this.FLATTEN_MAP = result.FLATTEN_MAP;
        }
      },
      immediate: true
    },
  },

  created() {
  },

  methods: {
    propagateInput(value) {
      this.$emit('input', value);
    },

    getCityByAdcode(adcode) {
      if (!adcode) {
        return null;
      }

      const city = this.FLATTEN_MAP.find(m => m.place.adcode === adcode);

      if (city) {
        return city.place;
      } else {
        return null;
      }
    },

    getCityByName(name) {
      const province = name.province ? name.province : '.*';
      const city = name.city ? name.city : '.*';
      const district = name.district ? name.district : '.*';
      const array = [province, city, district];
      if (!name.district) {
        array.pop();
        if (!name.city) {
          array.pop();
        }
      }
      const regexp = array.join(' \/ ');
      const result = this.FLATTEN_MAP.find(m => new RegExp(regexp).test(m.fullName));
      if (result) {
        return result.place;
      } else {
        return null;
      }
    }
  },
};

</script>

<style lang="stylus">
.el-zoom-in-top-enter-active
.el-zoom-in-top-leave-active
  opacity 1
  transform scaleY(1)
  transition transform 300ms cubic-bezier(0.23, 1, 0.32, 1) 100ms, opacity 300ms cubic-bezier(0.23, 1, 0.32, 1) 100ms
  transform-origin center top

.el-zoom-in-top-enter
.el-zoom-in-top-leave-active
  opacity 0
  transform scaleY(0)

.el-zoom-in-center-enter-active
.el-zoom-in-center-leave-active
  transition all .3s cubic-bezier(.55,0,.1,1)

.el-zoom-in-center-enter
.el-zoom-in-center-leave-active
  opacity 0
  transform scaleX(0)

.region-picker
  font-size 14px
  position relative
  display inline-block
  width 100%
  user-select none

  .picker-toggle
    position relative
    cursor pointer

    input.placeholder
      position absolute
      top 0
      right 0
      bottom 0
      left 0
      border none

    &.disabled
      cursor not-allowed
      input
        background-color #eef1f6
        border-color #d1dbe5
        color #bbb
      .picker-label
        color #bbb
      .picker-input-icon
        cursor not-allowed

    .picker-label
      position absolute
      left 0
      top 0
      height 100%
      line-height 36px
      padding 0 25px 0 10px
      color #1f2d3d
      width 100%
      white-space nowrap
      text-overflow ellipsis
      overflow hidden
      box-sizing border-box
      font-size 14px
      text-align left

    input
      background-color #fff
      position relative
      overflow hidden
      text-overflow ellipsis
      cursor pointer
      border-radius 4px
      border 1px solid #c0ccda
      color #1f2d3d
      font-size inherit
      height 36px
      box-sizing border-box
      line-height 1
      padding 3px 15px 3px 10px
      width 100%
      &:hover
        border-color #8391a5
      &:focus
        outline none
        border-color #20a0ff

    .picker-input-icon
      position absolute
      top 11px
      right 10px
      color #E0E6ED
      cursor pointer
      &.el-icon-circle-close:hover
        color #8391a5
    &.opened.picker-input-icon
      border-bottom-color #E0E6ED

  .picker-menu
    position absolute
    max-height 400px
    z-index 1000
    position absolute
    margin-top 5px
    background-color #ffffff
    border 1px solid #E0E6ED
    border-radius 2px
    box-shadow 0px 2px 4px 0px rgba(0,0,0,0.12), 0px 0px 6px 0px rgba(0,0,0,0.04)
    &:hover
      border-color #20a0ff
    .scroll-search
      min-width 350px
      .scroll-option
        li
          &:hover
            background-color #eff2f7
    .scroll-options
      display flex
      margin-left 1px
    .scroll-option
      min-width 150px
      max-height 275px
      overflow-y scroll
      padding 0
      margin 0
      border-right 1px solid #E0E6ED
      list-style none

      li
        line-height 36px
        cursor pointer
        position relative
        padding 0 10px
        white-space nowrap
        &.hover
          background-color #eff2f7

</style>

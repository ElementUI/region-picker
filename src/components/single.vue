<template lang="pug">
.region-picker-single(v-clickoutside="hidePicker")
  .picker-toggle(
        @click="handleClickPickerToggle"
        :class="{ opened: pickerVisible }"
        @mouseenter="inputHover = true"
        @mouseleave="inputHover = false"
      )
    input(
      v-model="searchValue"
      ref="input"
      @input="debouncedSearch"
    )
    span.picker-label(v-if="!pickerVisible") {{ selected.fullName }}
    i.picker-input-icon(
        :class="iconClass"
        @click="handleIconClick"
      )

  transition(name="el-zoom-in-top")
    .picker-menu(v-show="pickerVisible")
      .scroll-search(v-show="searchValue")
        ul.scroll-option(ref="result")
          li(
              v-for="result in results"
              :key="result.place.adcode"
              :class="{ hover: result.fullName === selected.fullName }"
              @click="select(result.place)"
            )
            span {{ result.fullName }}
          li(v-if="!results.length")
            span 无匹配数据
      .scroll-options(v-show="!searchValue")
        ul.scroll-option(ref="province")
          li(
              v-for="province in provinces"
              :key="province.adcode"
              :class="{ hover: current.province === province }"
              @mouseenter="current.province = province; current.city = null"
              @click="select(province)"
            )
            span {{ province.name }}
        ul.scroll-option(ref="city")
          li(
              v-for="city in cities"
              :key="city.adcode"
              :class="{ hover: current.city === city }"
              @mouseenter="current.city = city"
              @click="select(city)"
            )
            span {{ city.name }}
        ul.scroll-option(ref="district", v-if="maxLevel > 2")
          li(
              v-for="district in districts"
              :key="district.adcode"
              :class="{ hover: current.district === district }"
              @mouseenter="current.district = district"
              @click="select(district)"
            )
            span {{ district.name }}
</template>

<style lang="stylus">
.region-picker
  font-size 14px
  position relative
  display inline-block
  width 100%
  .picker-toggle
    position relative

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
      cursor pointer
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

<script>
import Clickoutside from '../utils/clickoutside';
import debounce from 'throttle-debounce/debounce';

export default {
  name: 'region-picker-single',

  directives: {
    Clickoutside,
  },

  props: {
    value: {
      type: [
        String,
        Array,
      ],
    },
    map: Object,
    flattenMap: Array,
    maxLevel: {
      type: Number,
      default: 3,
    },
  },

  data() {
    return {
      // 是否显示下拉菜单
      pickerVisible: false,
      // 当前展开的
      current: {
        province: null,
        city: null,
        district: null,
      },
      selected: {},
      results: {},
      searchValue: '',
      debouncedSearch: () => (() => {}),
      inputHover: false,
    };
  },

  computed: {
    provinces() {
      return this.map.districts;
    },
    cities() {
      if (!this.current.province) {
        return [];
      }
      return this.current.province.districts;
    },
    districts() {
      if (!this.current.city) {
        return [];
      }
      return this.current.city.districts;
    },
    iconClass() {
      if (this.selected.adcode && this.inputHover) {
        return 'el-icon-circle-close';
      } else if (this.pickerVisible) {
        return 'el-icon-caret-top';
      }
      return 'el-icon-caret-bottom';
    },
  },

  watch: {
    pickerVisible: {
      handler(visible) {
        if (visible) {
          this.scrollTo(this.selected);
        } else {
          this.clearSearch();
          this.select(this.selected);
        }
      },
    },
    selected: {
      handler(place) {
        this.$emit('input', place.adcode);
      },
    },
  },

  created() {
    this.debouncedSearch = debounce(300, this.search);
  },

  mounted() {
  },

  methods: {
    handleClickPickerToggle(e) {
      this.pickerVisible = !this.pickerVisible;
      if (this.pickerVisible) {
        this.$refs.input.focus();
        e.stopPropagation();
      } else {
        this.$refs.input.blur();
        e.stopPropagation();
      }
    },
    hidePicker() {
      this.pickerVisible = false;
    },
    select(place) {
      this.hidePicker();
      this.selected = place;
      const map = ['country', 'province', 'city', 'district'];

      if (!place.adcode) {
        this.current.province = null;
        this.current.city = null;
        this.current.district = null;
      }

      const set = (p) => {
        const { level } = p;
        if (level > 1) {
          set(p.parent);
        }
        this.current[map[p.level]] = p;
      };

      set(place);

      this.clearSearch();
    },
    search(e) {
      const value = e.target.value;
      if (value) {
        const results = this.flattenMap.filter(item => item.fullName.indexOf(value) !== -1 && item.place.level < this.maxLevel + 1);
        this.results = results;
        this.$nextTick(() => {
          this.$refs.result.scrollTop = 0;
        });
      }
    },
    clearSearch() {
      this.searchValue = '';
      this.searching = false;
    },
    scrollTo(place) {
      const { adcode, level, parent } = place;
      if (adcode) {
        if (level > 1) {
          this.scrollTo(parent);
        }
        if (level > 0) {
          const map = ['country', 'province', 'city', 'district'];
          const keys = Object.keys(parent.districts);
          const index = keys.indexOf(adcode);
          this.$nextTick(() => {
            this.$refs[map[level]].scrollTop = index * 36;
          });
        }
      }
    },
    handleIconClick(e) {
      console.log(e.target);
      if (this.selected.adcode && this.inputHover) {
        this.select({});
        this.$nextTick(() => {
          this.$refs.province.scrollTop = 0;
        });
        e.stopPropagation();
      }
    },
  },
};

</script>

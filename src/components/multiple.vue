<template lang="pug">
.region-picker-multiple(v-clickoutside="hidePicker")
  .picker-toggle(
      @mouseup.capture="handleClickPickerToggle"
      :class="{ opened: pickerVisible, disabled: disabled || noData }"
    )
    .selected-labels
      input.placeholder(
        :placeholder="placeholder"
        v-show="!noData && !selected.length"
      )
      template(v-if="noData")
        span 无城市数据
      transition-group(name="el-zoom-in-center", v-else)
        span.selected-label(
          v-for="place in selected"
          :key="place.adcode"
        )
          span {{ place.fullName || place.name }}
          i.el-icon-close(@mouseup.stop.prevent="remove(place)")

  transition(name="el-zoom-in-top")
    .picker-menu(v-show="pickerVisible")
      .picker-search
        input(
          placeholder="搜索"
          v-model="searchValue"
          @input="debouncedSearch"
        )
      .scroll-search(v-show="searchValue")
        ul.scroll-option(ref="result")
          li(
              v-for="result in results"
              :key="result.place.adcode"
              :class="{ hover: result.fullName === selected.fullName }"
              @click="selectResult(result.place);"
            )
            span {{ result.fullName }}
          li(v-if="!results.length")
            span 无匹配数据
      .scroll-options(v-show="!searchValue")
        ul.scroll-option(ref="province")
          li.place-checkbox(
              v-for="province in provinces"
              :key="province.adcode"
              :class="{\
                hover: current.province === province,\
                on: province.surplus === 0,\
                off: province.surplus === province.childrenLength,\
                part: province.surplus > 0 && province.surplus < province.childrenLength }"
              @mouseenter="current.province = province; current.city = null"
              @click="select(province)"
            )
            span {{ province.name }}
        ul.scroll-option(ref="city")
          li.place-checkbox(
              v-for="city in cities"
              :key="city.adcode"
              :class="{\
                hover: current.city === city,\
                on: city.surplus === 0,\
                off: city.surplus === city.childrenLength,\
                part: (city.surplus > 0) && (city.surplus < city.childrenLength) }"
              @mouseenter="current.city = city"
              @click="select(city)"
            )
            span {{ city.name }}
        ul.scroll-option(ref="district", v-if="maxLevel > 2")
          li.place-checkbox(
              v-for="district in districts"
              :key="district.adcode"
              :class="{\
                hover: current.district === district,\
                on: district.surplus === 0,\
                off: district.surplus === district.childrenLength,\
                part: district.surplus > 0 && district.surplus < district.childrenLength }"
              @mouseenter="current.district = district"
              @click="select(district)"
            )
            span {{ district.name }}
      .picker-opertaions
        div
          .place-checkbox(
              :class="{\
                on: map.surplus === 0,\
                off: map.surplus === map.childrenLength,\
                part: map.surplus > 0 && map.surplus < map.childrenLength }"
              @click="select(map)"
            )
            span 全国
        div
          button(@click.stop.prevent="hidePicker") 取消
          button.primary(@click.stop.prevent="handleConfirm") 确定
</template>

<style lang="stylus">

.region-picker-multiple
  .picker-toggle.disabled
    .selected-labels
      cursor not-allowed
      background-color #eef1f6
      border-color #d1dbe5
      color #bbb
      .selected-label
        i:hover
          color #20a0ff
          background transparent
  .selected-labels
    user-select none
    min-width 50px
    background #fff
    position relative
    overflow hidden
    text-overflow ellipsis
    cursor pointer
    border-radius 4px
    border 1px solid #c0ccda
    color #1f2d3d
    font-size inherit
    min-height 36px
    box-sizing border-box
    padding 3px 15px 3px 10px
    width 100%
    display flex
    align-items center
    flex-wrap wrap
    &:hover
      border-color #8391a5
    &:focus
      outline none
      border-color #20a0ff
    .selected-label
      display inline-flex
      align-items center
      justify-content center
      margin 3px 3px
      background-color #8391a5
      padding 5px
      height 24px
      line-height 24px
      font-size 12px
      color #fff
      border-radius 4px
      box-sizing border-box
      border 1px solid transparent
      background-color rgba(32,160,255,.1)
      border-color rgba(32,160,255,.2)
      color #20a0ff
      i
        margin-left 3px
        font-size 10px
        padding 2px
        border-radius 50%
        &:hover
          background-color #20a0ff
          color #fff

      &:first-child
        margin-left 0
  .picker-search
    padding 10px
    input
      background #fff
      position relative
      overflow hidden
      text-overflow ellipsis
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
  .scroll-options
  .scroll-search
    border-top 1px solid #E0E6ED
    border-bottom 1px solid #E0E6ED
  .picker-opertaions
    padding 10px
    display flex
    align-items center
    justify-content space-between
    button
      margin 0 5px
      display inline-block
      line-height 1
      white-space nowrap
      cursor pointer
      background #fff
      border 1px solid #bfcbd9
      color #1f2d3d
      border-radius 4px
      padding 7px 9px
      font-size 12px
      border-radius 4px
      outline 0
      text-align center
      &:hover
        color #20a0ff
        border-color #20a0ff
      &.primary
        color #fff
        background-color #20a0ff
        border-color #20a0ff
        &:hover
          background #4db3ff
          border-color #4db3ff
          color #fff

  .scroll-option li.place-checkbox
    padding-left 25px
  .place-checkbox
    padding-left 25px
    background-position left
    background-position-x 5px
    background-repeat no-repeat
    cursor pointer
    &.on
      background-image url("./images/checkbox_on.svg")
    &.off
      background-image url("./images/checkbox_off.svg")
    &.part
      background-image url("./images/checkbox_part.svg")

</style>

<script>
import Clickoutside from '../utils/clickoutside';
import emitter from '../utils/emitter';
import debounce from 'throttle-debounce/debounce';

export default {
  name: 'region-picker-multiple',

  directives: {
    Clickoutside,
  },

  mixins: [emitter],

  props: {
    value: {
      type: [
        Array,
        String,
      ],
    },
    map: Object,
    flattenMap: Array,
    maxLevel: {
      type: Number,
      default: 3,
    },
    disabled: {
      type: Boolean,
      default: false
    },
    placeholder: {
      type: String,
    },
  },

  data() {
    return {
      pickerVisible: false,
      selected: [],
      current: {
        province: null,
        city: null,
        district: null,
      },
      results: [],
      records: [],
      confirmed: false,
      searchValue: '',
      debouncedSearch: () => (() => {}),
      clickClose: false,
    };
  },

  computed: {
    provinces() {
      return this.map && this.map.districts;
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
      if (this.pickerVisible) {
        return 'el-icon-caret-top';
      }
      return 'el-icon-caret-bottom';
    },
    noData() {
      return !this.map || !Object.keys(this.map).length;
    }
  },

  watch: {
    pickerVisible: {
      handler(visible) {
        if (!visible && !this.confirmed) {
          this.revokeSelect();
        }
        this.confirmed = false;
        this.records = [];
        if (visible === false) {
          const adcodes = this.selected.map((place) => place.adcode);
          this.dispatch('ElFormItem', 'el.form.blur', [adcodes]);
        }
      },
    },
    value: {
      handler(adcodes) {
        this.setValue(adcodes);
      },
      immediate: true,
    },
    map: {
      handler(map) {
        if (map && Object.keys(map).length) {
          this.setValue(this.value);
        }
      },
      immediate: true,
    },
  },

  created() {
    this.debouncedSearch = debounce(300, this.search);
  },

  methods: {
    setValue(adcodes) {
      if (adcodes && adcodes.length) {
        const { flattenMap } = this;
        let length = adcodes.length;
        for (let i = 0; length && i < flattenMap.length; i++) {
          const place = flattenMap[i].place;
          if (adcodes.indexOf(place.adcode) !== -1) {
            if (this.selected.indexOf(place) === -1) {
              this.select(place, true);
            }
            length--;
            if (length === 0) {
              this.scrollTo(place);
            }
          }
        }
        for (let i = 0; i < this.selected.length; i++) {
          const place = this.selected[i];
          if (adcodes.indexOf(place.adcode) === -1) {
            this.select(place, true);
          }
        }
        this.updateSelected(true);
      }
    },
    handleClickPickerToggle(e) {
      if (this.disabled || this.noData) {
        return false;
      }
      if (e.target.tagName !== 'I') {
        this.pickerVisible = !this.pickerVisible;
      }
    },
    hidePicker() {
      this.pickerVisible = false;
    },
    updateParent(place, count) {
      if (!place) {
        return;
      }
      this.$set(place, 'surplus', place.surplus + count);

      this.updateParent(place.parent, count);
    },
    updateChildren(place, shouldCheck) {
      const { districts } = place;
      if (!districts) {
        return;
      }
      Object.keys(districts).forEach((key) => {
        const district = districts[key];
        this.updateChildren(district, shouldCheck);
        if (shouldCheck) {
          district.surplus = 0;
        } else {
          district.surplus = district.childrenLength;
        }
      });
    },
    updateSelected(shouldNotEmit) {
      this.selected = [];
      const values = [];
      const traverse = (place) => {
        if (!place) {
          return null;
        }
        if (place.surplus === 0) {
          this.selected.push(place);
          values.push(place.adcode);
        } else if (place.surplus < place.childrenLength) {
          Object.keys(place.districts).forEach((key) => {
            traverse(place.districts[key]);
          });
        }
        return null;
      };
      traverse(this.map);

      if (!shouldNotEmit) {
        this.$emit('input', values);
        this.dispatch('ElFormItem', 'el.form.change', [values]);
      }
    },
    select(place, shouldNotRecord) {
      if (!shouldNotRecord) {
        this.records.push(place);
      }
      const shouldCheck = place.surplus !== 0;
      const oldSurplus = place.surplus;
      if (shouldCheck) {
        place.surplus = 0;
      } else {
        place.surplus = place.childrenLength;
      }
      this.updateChildren(place, shouldCheck);
      this.updateParent(place.parent, place.surplus - oldSurplus);
      this.$forceUpdate();
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
          this.current[map[level]] = place;
          this.$nextTick(() => {
            const dom = this.$refs[map[level]];
            if (dom) {
              dom.scrollTop = index * 36;
            }
          });
        }
      }
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
    selectResult(place) {
      this.select(place);
      this.scrollTo(place);
      this.searchValue = '';
    },
    handleConfirm() {
      this.confirmed = true;
      this.pickerVisible = false;
      this.updateSelected();
    },
    revokeSelect() {
      this.records.reverse().forEach((place) => {
        this.select(place);
      });
    },
    remove(place) {
      if (!this.disabled) {
        this.select(place, true);
        this.updateSelected();
        return false;
      }
    },

  },
};

</script>

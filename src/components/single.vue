<template lang="pug">
.region-picker-single(
  v-clickoutside="hidePicker"
)
  .picker-toggle(
    @click="handleClickPickerToggle"
    :class="{ opened: pickerVisible, disabled: disabled || noData }"
    @mouseenter="inputHover = true"
    @mouseleave="inputHover = false"
  )
    input(
      v-model="searchValue"
      ref="input"
      @input="debouncedSearch"
      :placeholder="Object.keys(selected).length ? '' : placeholder"
    )
    span.picker-label(v-if="!pickerVisible")
      span(v-if="noData") 无城市数据
      span(v-else)  {{ selected.fullName }}
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

</style>

<script>
import Clickoutside from '../utils/clickoutside';
import debounce from 'throttle-debounce/debounce';
import emitter from '../utils/emitter';

export default {
  name: 'region-picker-single',

  directives: {
    Clickoutside,
  },

  mixins: [emitter],

  props: {
    value: {
      type: String
    },
    map: Object,
    flattenMap: Array,
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
      if (this.selected.adcode && this.inputHover && !this.disabled) {
        return 'el-icon-circle-close';
      } else if (this.pickerVisible) {
        return 'el-icon-caret-top';
      }
      return 'el-icon-caret-bottom';
    },
    noData() {
      return !this.map || !Object.keys(this.map).length;
    },
    computedPlaceholder() {
    }
  },

  watch: {
    pickerVisible: {
      handler(visible) {
        if (visible) {
          this.scrollTo(this.selected);
        } else {
          this.clearSearch();
          this.select(this.selected);
          this.dispatch('ElFormItem', 'el.form.blur', [this.selected.adcode]);
        }
      },
    },
    selected: {
      handler(place) {
        this.$emit('input', place.adcode);
        this.dispatch('ElFormItem', 'el.form.change', [place.adcode]);
      },
    },
    value: {
      handler(value) {
        this.setValue(value);
      },
      immediate: true
    },
    map: {
      handler(map) {
        if (map && Object.keys(map).length) {
          this.setValue(this.value);
        }
      },
      immediate: true
    }
  },

  created() {
    this.debouncedSearch = debounce(300, this.search);
  },

  mounted() {
  },

  methods: {
    setValue(adcode) {
      if (adcode) {
        const { flattenMap } = this;
        for (let i = 0; i < flattenMap.length; i++) {
          const place = flattenMap[i].place;
          if (place.adcode === adcode) {
            this.select(place);
            return true;
          }
        }
      }
    },
    handleClickPickerToggle(e) {
      if (this.disabled || this.noData) {
        return false;
      }
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
            const dom = this.$refs[map[level]];
            if (dom) {
              dom.scrollTop = index * 36;
            }
          });
        }
      }
    },
    handleIconClick(e) {
      if (this.selected.adcode && this.inputHover && !this.disabled) {
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

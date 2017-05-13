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
import Data from './data.json';
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
      default: () => Data,
    },

    maxLevel: {
      type: Number,
      default: 3,
    },
  },

  data() {
    return {
      MAP: {},
      FLATTEN_MAP: [],
    };
  },

  created() {
    const result = createMap(JSON.parse(JSON.stringify(Data)));
    this.MAP = result.MAP;
    this.FLATTEN_MAP = result.FLATTEN_MAP;
  },

  methods: {
    propagateInput(value) {
      this.$emit('input', value);
    },
  },
};

</script>

<style lang="stylus">
.el-zoom-in-top-enter-active,
.el-zoom-in-top-leave-active {
  opacity 1
  transform scaleY(1)
  transition transform 300ms cubic-bezier(0.23, 1, 0.32, 1) 100ms, opacity 300ms cubic-bezier(0.23, 1, 0.32, 1) 100ms
  transform-origin center top
}
.el-zoom-in-top-enter,
.el-zoom-in-top-leave-active {
  opacity 0
  transform scaleY(0)
}
.el-zoom-in-center-enter-active,
.el-zoom-in-center-leave-active {
  transition: all .3s cubic-bezier(.55,0,.1,1);
}
.el-zoom-in-center-enter,
.el-zoom-in-center-leave-active {
  opacity: 0;
  transform: scaleX(0);
}

</style>

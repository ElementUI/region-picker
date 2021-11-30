import Tree from './tree'
import Clickoutside from '../utils/clickoutside'
import emitter from '../utils/emitter'
import './region-picker.styl'
import * as Icon from './svg-icon'

export default {
  name: 'region-picker',

  directives: {
    Clickoutside
  },

  mixins: [emitter],

  props: {
    value: [String, Array],
    // panel placement
    placement: {
      type: String,
      default: 'bottom'
    },
    // whether multiple select
    multiple: {
      type: Boolean,
      default: false
    },
    // city data
    data: Object,
    // max level of city
    maxLevel: {
      type: Number,
      default: 3
    },
    // whether disable
    disabled: {
      type: [Boolean, Array],
      default: false
    },
    collapseTags: {
      type: Boolean,
      default: false
    },
    // placeholder
    placeholder: String,
    searchPlaceholder: {
      type: String,
      default: '搜索'
    },
    noMatchText: {
      type: String,
      default: '无匹配数据'
    },
    noDataText: {
      type: String,
      default: '无城市数据'
    },
    renderLabel: {
      type: Function,
      default(h) {
        if (!this.data) {
          return h('span', { class: { 'region-picker__label': true } }, [
            this.noDataText
          ])
        } else if (this.multiple && this.selected.length) {
          return h(
            'transition-group',
            {
              props: {
                name: 'el-zoom-in-center'
              },
              class: {
                'region-picker__tag__list': true
              }
            },
            this.collapseTags
              ? [
                  h(
                    'span',
                    {
                      class: {
                        'region-picker__tag__item': true
                      },
                      key: this.selected[0].data.adcode
                    },
                    [
                      h('span', {}, [this.selected[0].fullName]),
                      h('i', {
                        class: { 'el-icon-circle-close': true },
                        on: {
                          click: $event => {
                            $event.stopPropagation()
                            this.handleSelect(this.selected[0])
                          }
                        }
                      })
                    ]
                  ),
                  h(
                    'span',
                    {
                      class: {
                        'region-picker__tag__item': true
                      },
                      key: 'COUNT',
                      directives: [
                        {
                          name: 'show',
                          value: this.selected.length > 1
                        }
                      ]
                    },
                    [h('span', {}, [`+ ${this.selected.length - 1}`])]
                  )
                ]
              : [
                  this.selected.map(node =>
                    h(
                      'span',
                      {
                        class: {
                          'region-picker__tag__item': true
                        },
                        key: node.data.adcode
                      },
                      [
                        h('span', {}, [node.fullName]),
                        h('i', {
                          class: { 'el-icon-circle-close': true },
                          on: {
                            click: $event => {
                              $event.stopPropagation()
                              this.handleSelect(node)
                            }
                          }
                        })
                      ]
                    )
                  )
                ]
          )
        } else if (!this.multiple && this.selected) {
          return h('div', { class: { 'region-picker__label': true } }, [
            h('span', {}, [this.selected.fullName])
          ])
        }

        return h('span', { class: { 'region-picker__placeholder': true } }, [
          this.placeholder
        ])
      }
    },
    renderItem: {
      type: Function,
      default(h, node) {
        return h(
          'span',
          { class: { 'region-picker__option__item-default': true } },
          [
            this.multiple && Icon[['empty', 'full', 'part'][node.status]](h),
            node.data.name
          ]
        )
      }
    },
    cancelText: {
      type: String,
      default: '取消'
    },
    confirmText: {
      type: String,
      default: '确认'
    }
  },

  data: () => ({
    tree: null,
    panelVisible: false,
    current: null,
    searchValue: '',
    inputHover: false,
    isFocus: false,

    _selected: [],
    _initSelected: [],
    confirmed: false
  }),

  computed: {
    columns() {
      return !this.data
        ? [[], [], []]
        : [
            this.tree.tree.children,
            this.current && this.current.province
              ? this.current.province.children
              : [],
            this.current && this.current.city ? this.current.city.children : []
          ].slice(0, this.maxLevel)
    },
    iconClass() {
      const cls = {
        'region-picker__picker__icon': true
      }

      if (this.disabled === true) {
      } else if (
        this.inputHover &&
        ((this.multiple && this.selected.length) ||
          (!this.multiple && this.selected))
      ) {
        cls['el-icon-circle-close'] = true
      } else {
        cls['el-icon-arrow-down'] = true
        cls['is-reverse'] = this.panelVisible
      }

      return cls
    },

    selected: {
      set(val) {
        if (!val || !this.data) return
        if (!Array.isArray(val)) val = [val]
        if (typeof val[0] === 'string') {
          val = val.map(adcode => this.tree.getNodeByAdcode(adcode))
        }
        this.tree.select(this.tree.tree, false)
        val.forEach(n => this.tree.select(n, true))
      },

      get() {
        if (!this.tree) return []
        const array = []
        const traverse = node => {
          if (!node) return []
          if (node.selected || node.surplus === 0) {
            array.push(node)
          } else if (node.surplus !== node.full) {
            ;(node.children || []).forEach(n => traverse(n))
          }
        }

        traverse(this.tree.tree)

        return this.multiple ? array : array[0]
      }
    },

    modelValue() {
      return this.multiple
        ? this.selected.map(node => node.data.adcode)
        : (this.selected || { data: {} }).data.adcode
    },

    searchPattern() {
      return this.searchValue
        .trim()
        .split(/\s+/)
        .reduce((prev, cur) => {
          prev += `\\s*(\\S*${cur}\\S*)\\s*`
          return prev
        }, '')
    },

    searchResult() {
      const array = [[], [], []]
      if (!this.tree || !this.searchValue) return array

      const pattern = new RegExp(
        this.searchValue
          .trim()
          .split(/\s+/)
          .reduce((prev, cur) => {
            prev += `\\s*(\\S*${cur}\\S*)\\s*/?`
            return prev
          }, ''),
        'i'
      )
      const traverse = node => {
        if (!node) return
        if (pattern.test(node.fullName)) {
          array[node.level - 1].push(node)
        }

        ;(node.children || []).forEach(n => traverse(n))
      }

      this.tree.tree.children.forEach(province => traverse(province))

      return array
    },

    hasSearchResult() {
      return this.searchResult.reduce((prev, cur) => (prev += cur.length), 0)
    }
  },

  watch: {
    data: {
      handler(val) {
        this.tree = new Tree(val, {
          multiple: !!this.multiple
        })
        this.selected = this._initSelected
      },
      immediate: true
    },

    disabled: {
      handler(val) {
        if (!this.tree) return
        if (Array.isArray(val)) {
          this.tree.setDisabled(val)
        } else {
          this.tree.setDisabled([])
        }
      },
      immediate: true
    },

    value: {
      handler(val) {
        this.selected = val
        this._initSelected = val
      },
      immediate: true
    }
  },

  methods: {
    focus() {
      if (this.disabled === true || !this.tree) return
      this.panelVisible = true
      this.confirmed = false
      if (this.multiple) {
        this._selected = this.selected.slice()
      }
      if (this.$refs.searchInput) {
        this.$nextTick(() => {
          this.$refs.searchInput.focus()
          this.$emit('focus')
          this.isFocus = true
        })
      }
    },
    blur() {
      this.panelVisible = false
      this.searchValue = ''
      if (this.multiple && !this.confirmed) {
        this.selected = this._selected
      }
      if (this.$refs.searchInput) {
        this.$nextTick(() => {
          this.$refs.searchInput.blur()
          this.$emit('blur')
          this.dispatch('ElFormItem', 'el.form.blur', this.modelValue)
          this.isFocus = false
        })
      }
    },
    confirm() {
      this.confirmed = true
      this.blur()
    },
    handleMouseenter(node) {
      if (node.disabled) {
        this.current = null
      } else {
        this.current = node
      }
    },
    handleSelect(node) {
      if (node.disabled) return
      if (this.multiple) {
        this.tree.select(node, !node.selected)
      } else {
        if (this.selected && this.selected !== node) {
          this.tree.select(this.selected, false)
        }
        this.tree.select(node, true)
        this.blur()
      }
      this.$emit('change', this.modelValue)
      this.$emit('input', this.modelValue)
      this.dispatch('ElFormItem', 'el.form.change', this.modelValue)
    },
    handleClickPicker() {
      if (!this.data || this.disabled === true) return
      this.panelVisible ? this.blur() : this.focus()
    },
    clear(e) {
      e.stopPropagation()
      this.selected = []
      this.$emit('change', null)
      this.$emit('input', null)
      this.blur()
    }
  },

  render(h) {
    const isHover = node => {
      let parent = this.current
      while (parent) {
        if (parent === node) return true
        parent = parent.parent
      }
      return false
    }

    return h(
      'div',
      {
        class: {
          'region-picker': true,
          multiple: this.multiple,
          focus: this.isFocus,
          disabled: this.disabled === true || !this.data
        },
        directives: [
          {
            name: 'clickoutside',
            value: () => {
              if (!this.panelVisible) return
              this.blur()
            }
          }
        ]
      },
      [
        // Picker
        h(
          'div',
          {
            class: {
              'region-picker__picker': true
            },
            on: {
              click: this.handleClickPicker,
              mouseenter: () => (this.inputHover = true),
              mouseleave: () => (this.inputHover = false)
            }
          },
          [
            h(
              'div',
              {
                class: {
                  'region-picker__label__wrap': true
                },
                directives: [
                  {
                    name: 'show',
                    value: !this.panelVisible || this.multiple
                  }
                ]
              },
              [this.renderLabel.call(this, h, this)]
            ),
            !this.multiple &&
              h(
                'div',
                {
                  class: {
                    'region-picker__search': true
                  },
                  directives: [
                    {
                      name: 'show',
                      value: this.panelVisible && !this.multiple
                    }
                  ]
                },
                [
                  h('input', {
                    domProps: {
                      value: this.searchValue
                    },
                    on: {
                      input: $event => (this.searchValue = $event.target.value)
                    },
                    attrs: {
                      type: 'text',
                      placeholder: this.searchPlaceholder
                    },
                    ref: 'searchInput'
                  })
                ]
              ),
            !this.multiple &&
              h(
                'span',
                {
                  class: 'region-picker__picker__suffix'
                },
                [
                  h('i', {
                    class: this.iconClass,
                    on: {
                      click: this.clear
                    }
                  })
                ]
              )
          ]
        ),
        // Panel
        h(
          'transition',
          {
            attrs: {
              name:
                this.placement === 'top'
                  ? 'el-zoom-in-bottom'
                  : 'el-zoom-in-top'
            }
          },
          [
            h(
              'div',
              {
                class: {
                  'region-picker__panel': true,
                  [`max-level-${this.maxLevel}`]: true,
                  multiple: this.multiple,
                  [`placement-${this.placement}`]: true
                },
                directives: [
                  {
                    name: 'show',
                    value: this.panelVisible
                  }
                ]
              },
              [
                this.multiple &&
                  h(
                    'div',
                    {
                      class: {
                        'region-picker__search': true
                      }
                    },
                    [
                      h('input', {
                        domProps: {
                          value: this.searchValue
                        },
                        on: {
                          input: $event =>
                            (this.searchValue = $event.target.value)
                        },
                        attrs: {
                          type: 'text',
                          placeholder: this.searchPlaceholder
                        }
                      })
                    ]
                  ),
                // Search
                h(
                  'div',
                  {
                    class: {
                      'region-picker__result': true
                    },
                    directives: [
                      {
                        name: 'show',
                        value: this.searchValue && this.hasSearchResult
                      }
                    ]
                  },
                  [
                    this.searchResult.map((list, index) =>
                      h(
                        'div',
                        {
                          class: {
                            'region-picker__result__wrap': true
                          },
                          directives: [
                            {
                              name: 'show',
                              value: list.length
                            }
                          ],
                          key: index
                        },
                        [
                          h(
                            'div',
                            {
                              class: {
                                'region-picker__result__title': true
                              }
                            },
                            [['省', '市', '区'][index]]
                          ),
                          h(
                            'ul',
                            {
                              class: {
                                'region-picker__result__list': true
                              }
                            },
                            [
                              list.map((node, index) =>
                                h(
                                  'li',
                                  {
                                    class: {
                                      'region-picker__result__item': true,
                                      selected:
                                        node.status &&
                                        (this.multiple ||
                                          node.parent.status !== 1),
                                      all: node.status === 1,
                                      disabled: node.disabled
                                    },
                                    on: {
                                      click: () => this.handleSelect(node)
                                    }
                                  },
                                  [
                                    h(
                                      'span',
                                      {
                                        class: {
                                          'region-picker__result__item-default': true
                                        }
                                      },
                                      [
                                        this.multiple &&
                                          Icon[
                                            ['empty', 'full', 'part'][
                                              node.status
                                            ]
                                          ](h),
                                        node.fullName
                                      ]
                                    )
                                  ]
                                )
                              )
                            ]
                          )
                        ]
                      )
                    )
                  ]
                ),
                h(
                  'div',
                  {
                    class: {
                      'region-picker__result__empty': true
                    },
                    directives: [
                      {
                        name: 'show',
                        value: this.searchValue && !this.hasSearchResult
                      }
                    ]
                  },
                  [h('span', [this.noMatchText])]
                ),
                // options
                h(
                  'div',
                  {
                    class: {
                      'region-picker__options': true
                    },
                    directives: [
                      {
                        name: 'show',
                        value: !this.searchValue
                      }
                    ]
                  },
                  [
                    this.columns &&
                      this.columns.map(column =>
                        h(
                          'ul',
                          {
                            class: {
                              'region-picker__option__list': true
                            }
                          },
                          [
                            column &&
                              column.map(node =>
                                h(
                                  'span',
                                  {
                                    class: {
                                      'region-picker__option__item': true,
                                      hover: isHover(node),
                                      selected:
                                        node.status &&
                                        (this.multiple ||
                                          node.parent.status !== 1),
                                      all: node.status === 1,
                                      disabled: node.disabled
                                    },
                                    on: {
                                      mouseenter: () =>
                                        this.handleMouseenter(node),
                                      click: () => this.handleSelect(node)
                                    }
                                  },
                                  [this.renderItem(h, node, this)]
                                )
                              )
                          ]
                        )
                      )
                  ]
                ),
                // toolbar
                this.multiple &&
                  h(
                    'div',
                    {
                      class: { 'region-picker__toolbar': true }
                    },
                    [
                      h(
                        'span',
                        {
                          class: {
                            'region-picker__option__item': true,
                            selected: this.tree.tree.status && this.multiple
                          },
                          on: {
                            click: () => this.handleSelect(this.tree.tree)
                          }
                        },
                        [this.renderItem(h, this.tree.tree, this)]
                      ),

                      h('div', {}, [
                        h(
                          'button',
                          {
                            class: {
                              'region-picker__button': true,
                              default: true
                            },
                            on: {
                              click: () => this.blur()
                            }
                          },
                          this.cancelText
                        ),
                        h(
                          'button',
                          {
                            class: {
                              'region-picker__button': true,
                              primary: true
                            },
                            on: {
                              click: () => this.confirm()
                            }
                          },
                          this.confirmText
                        )
                      ])
                    ]
                  ),
                // arrow
                h('div', {
                  class: {
                    'region-picker__panel__arrow': true,
                    [`placement-${this.placement}`]: true
                  }
                })
              ]
            )
          ]
        )
      ]
    )
  }
}

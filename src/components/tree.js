class Node {
  constructor(tree, options) {
    this.tree = tree
    this.data = options.data
    this.parent = options.parent
    this.children = options.children
    this.surplus = options.count
    this.full = options.count
    this.level = options.level
    this.key = options.key
    this.selected = options.selected
  }

  get fullName() {
    if (this.level === 0) return this.data.name
    const array = []
    let parent = this
    while (parent && parent.level) {
      array.unshift(parent.data.name)
      parent = parent.parent
    }
    return array.join(' / ')
  }

  get province() {
    if (this.level < 1) return null
    let parent = this
    while (parent && parent.level !== 1) {
      parent = parent.parent
    }
    return parent
  }

  get city() {
    if (this.level < 2) return null
    let parent = this
    while (parent && parent.level !== 2) {
      parent = parent.parent
    }
    return parent
  }

  get district() {
    if (this.level < 3) return null
    return this
  }

  get status() {
    if (this.surplus === this.full) return 0
    if (this.surplus === 0) return 1
    return 2
  }

  get disabled() {
    const list = this.tree.disabled
    let parent = this
    while (parent) {
      if (list.indexOf(parent.data.adcode) !== -1) return true
      parent = parent.parent
    }
    return false
  }
}

export default class Tree {
  constructor(data, options) {
    this.options = Object.assign({}, options)
    this.adcodeMap = {}
    this.disabled = []

    this.tree = this._traverse(data, 0, null)
  }

  select(node, bool) {
    function broadcast(node) {
      if (!node) return
      node.selected = bool
      node.surplus = bool ? 0 : node.full
      ;(node.children || []).forEach(n => broadcast(n, bool))
    }

    const count = bool ? node.surplus : node.full - node.surplus
    function propagate(node) {
      if (!node) return
      if (node.parent) {
        node.parent.surplus += (bool ? -1 : 1) * count
        node.parent.selected = node.parent.surplus === 0
      }
      propagate(node.parent, bool)
    }

    broadcast(node)
    propagate(node)
  }

  getNodeByAdcode(adcode) {
    return this.adcodeMap[adcode] || null
  }

  setDisabled(disabled) {
    this.disabled = disabled
  }

  _traverse(data, level, parent) {
    if (!data) return null

    const node = new Node(this, {
      data,
      parent,
      children: null,
      count: 0,
      level,
      key: level
        ? parseInt(
            data.adcode.slice((level - 1) << 1, 2 + ((level - 1) << 1)),
            10
          )
        : 0,
      selected: false,
      full: 0,
      surplus: 0
    })

    this.adcodeMap[data.adcode] = node

    const districts = data.districts
    const { maxLevel } = this.options
    if ((!maxLevel && !districts) || maxLevel === level) {
      node.full = 1
      node.surplus = 1
      let p = parent
      while (p) {
        p.full++
        p.surplus++
        p = p.parent
      }
    }

    if (districts) {
      node.children = districts.map(d => this._traverse(d, level + 1, node))
    }

    return node
  }
}

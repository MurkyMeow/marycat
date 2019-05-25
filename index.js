(() => {
  const attr = name => value => {
    const attr = document.createAttribute(name)
    attr.value = value
    return attr
  }

  const text = data => document.createTextNode(data)

  const event = Symbol()
  const $ = Symbol()

  const on = (name, handler) => ({
    name,
    handler,
    _type: event,
  })

  const el = name => (...attrs) => {
    const children = []
    const $el = document.createElement(name)
    attrs.forEach(attr => {
      if (typeof attr === 'string') $el.classList.add(attr)
      else if (attr._type === event) $el.addEventListener(attr.name, attr.handler)
      else $el.setAttributeNode(attr)
    })
    const populate = child => {
      if (child !== $) {
        children.push(child)
        return populate
      }
      children.forEach(_child => {
        if (typeof _child === 'string') $el.appendChild(text(_child))
        else $el.appendChild(_child($))
      })
      return $el
    }
    return populate
  }

  const render = (vnode, $node) => {
    const $el = vnode($)
    $node.appendChild($el)
  }

  window.div = el('div')
  window.button = el('button')
  window.header = el('header')
  window.article = el('article')
  window.section = el('section')

  window.el = el
  window.on = on
  window.attr = attr
  window.render = render
})()
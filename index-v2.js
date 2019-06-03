(() => {
  const $ = Symbol('Magic wand turning pumpkins into something bigger')

  const el = name => (...entities) => {
    const $el = document.createElement(name)
    function chain(...entities) {
      for (const entity of entities) {
        if (entity === $) return $el
        if (typeof entity === 'string') {
          if (entity.startsWith('.')) $el.classList.add(entity.slice(1))
          else if (entity.startsWith('#')) $el.id = entity.slice(1)
          else $el.append(document.createTextNode(entity))
        }
        else if (typeof entity === 'function') $el.append(entity($))
        else throw new Error(`I dont think i can handle that child: ${JSON.stringify(entity)}`)
      }
      return chain
    }

    const attr = mapping => {
      Object.entries(mapping).forEach(([key, value]) => {
        const attr = document.createAttribute(key)
        attr.value = value
        $el.setAttributeNode(attr)
      })
      return chain
    }
    [ 'type',
    ].forEach(name => chain[name] = value => attr({ [name]: value }))

    const on = name => handler => {
      $el.addEventListener(name, handler)
      return chain
    }
    [ 'click', 'input', 'submit',
      'focus', 'blur', 'keydown',
    ].forEach(name => chain[name] = on(name))

    chain.attr = attr
    chain.on = (name, handler) => on(name)(handler)
    return chain(...entities)
  }

  function mount($node, vnode) {
    $node.append(vnode($))
  }

  window.marycat = {
    el, mount,
    elements: {
      div: el('div'),
      form: el('form'),
      input: el('input'),
      header: el('header'),
      article: el('article'),
    },
  }
})()
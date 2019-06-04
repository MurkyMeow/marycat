(() => {
  const $ = Symbol('Magic wand turning pumpkins into something bigger')

  const el = name => (...entities) => {
    const $el = document.createElement(name)
    function chain(...entities) {
      for (const entity of entities) {
        if (entity === $) return $el
        if (Array.isArray(entity)) return chain(...entity)
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

    chain.bind = state => {
      state(value => $el.value = value)
      chain.input(() => state.value = $el.value)
      return chain
    }

    chain.when = (...states) => {
      states.forEach(state => {
        state(() => $el.hidden = !states.some(x => x.value))
      })
      return chain
    }

    return chain(...entities)
  }

  function mount($node, vnode) {
    $node.append(vnode($))
  }

  function makeState(initial) {
    let current = initial
    const observers = []
    function subscribe(cb) {
      cb(current)
      observers.push(cb)
      return subscribe
    }
    Object.defineProperty(subscribe, 'value', {
      get: () => current,
      set(value) {
        current = value
        observers.forEach(cb => cb(value))
      }
    })
    subscribe.after = f => {
      if (typeof f !== 'function') throw new Error('after expects a function')
      const newState = makeState(current)
      subscribe(value => newState.value = f(value))
      return newState
    }
    return subscribe
  }

  function get(strings, ...keys) {
    const $nodes = strings.map((str, i) => {
      const state = keys[i]
      if (!state) return str
      const text = document.createTextNode(str)
      state(value => text.textContent = str + value)
      return entity => {
        if (entity === $) return text
        throw new Error('Getters are not appendable')
      }
    })
    return $nodes
  }

  window.marycat = {
    el, mount,
    makeState, get,
    elements: {
      h3: el('h3'),
      div: el('div'),
      form: el('form'),
      input: el('input'),
      header: el('header'),
      article: el('article'),
    },
  }
})()
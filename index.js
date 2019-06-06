(() => {
  const $ = Symbol('Magic wand turning pumpkins into something bigger')

  const el = name => (...entities) => {
    const $el = document.createElement(name)
    function chain(...entities) {
      for (const entity of entities) {
        if (entity === $) {
          if (chain.onConnected) chain.onConnected()
          return $el
        }
        if (Array.isArray(entity)) return chain(...entity)
        if (typeof entity === 'string') {
          if (entity.startsWith('.')) $el.classList.add(entity.slice(1))
          else if (entity.startsWith('@')) $el.name = entity.slice(1)
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
    [ 'type', 'placeholder',
    ].forEach(name => chain[name] = value => attr({ [name]: value }))

    const on = name => handler => {
      const [eventName, ...modifiers] = name.split('.')
      $el.addEventListener(eventName, e => {
        modifiers.forEach(mod => {
          if (mod === 'prevent') e.preventDefault()
          else if (mod === 'stop') e.stopPropagation()
          else console.error(`Unknown event modifier: "${mod}"`)
        })
        handler(e)
      })
      return chain
    }
    [ 'click', 'input', 'submit',
      'focus', 'blur', 'keydown',
    ].forEach(name => {
      chain[name] = on(name)
      chain[name].stop = on(`${name}.stop`)
      chain[name].prevent = on(`${name}.prevent`)
    })

    chain.attr = attr
    chain.on = (name, handler) => on(name)(handler)

    chain.bind = state => {
      if (name === 'form') {
        state.value = state.value || {}
        chain.input(e => state.value[e.target.name] = e.target.value)
        chain.onConnected = () => state(value => {
          $elements = Array.from($el)
          $elements.forEach(x => x.value = value[x.name] || '')
        })
      } else {
        state(value => $el.value = value)
        chain.input(() => state.value = $el.value)
      }
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
    return $node.appendChild(vnode($))
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
      button: el('button'),
      header: el('header'),
      article: el('article'),
    },
  }
})()
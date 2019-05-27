(() => {
  function assert(exp, message) {
    if (!exp) throw new Error(message)
  }

  const attr = name => value => {
    const attr = document.createAttribute(name)
    if (value._type === getter) {
      value.subscribe(newval => attr.value = newval)
    } else {
      attr.value = value
    }
    return attr
  }

  const text = data => document.createTextNode(data)

  const event = Symbol('Event')
  const getter = Symbol('Getter')
  const iterator = Symbol('Iterator')
  const condition = Symbol('Condition')
  const $ = Symbol()

  const on = name => handler => ({
    name,
    handler,
    _type: event,
  })

  const cond = value => ({
    value,
    _type: condition,
  })

  const iter = value => ({
    value,
    _type: iterator,
  })

  const array = (...items) => {
    const $refs = []
    const append = $el => {
      const $clone = $el.parentElement.appendChild($el.cloneNode(true))
      $refs[items.length] = $clone
    }
    return {
      items,
      push(value) {
        items.push(value)
        return { ...this, action: 'push', append }
      },
      remove(index) {
        const [$el] = $refs.splice(index, 1)
        if ($el) $el.remove()
        items.splice(index, 1)
        return { ...this, action: 'remove' }
      },
      pop() {
        return this.remove(items.length - 1)
      },
    }
  }

  const makeState = obj => {
    const observers = {}
    const get = (key, callback) => {
      observers[key] = observers[key] || []
      return {
        _type: getter,
        subscribe: f => {
          const produce = callback
            ? value => f(callback(value))
            : f
          produce(state[key])
          observers[key].push(produce)
        },
      }
    }
    const set = (key, value) => {
      const newval = typeof value === 'function' ? value(state[key]) : value
      state[key] = newval
    }
    const state = new Proxy(obj(get, set), {
      set(target, key, value) {
        target[key] = value
        observers[key].forEach(observer => observer(value))
      }
    })
    const wire = template => props => template({
      props,
      state: new Proxy(state, { get: (_, key) => get(key) }),
      view: state._view,
      action: state._action
    })
    return { set, wire }
  }

  const el = name => (...attrs) => {
    const children = []
    const $el = document.createElement(name)
    attrs.forEach($attr => {
      if (typeof $attr === 'string') $el.classList.add($attr)
      else if ($attr._type === event) $el.addEventListener($attr.name, $attr.handler)
      else if ($attr._type === condition) {
        assert($attr.value && $attr.value.subscribe, 'cond got an incorrect getter')
        $attr.value.subscribe(newval => $el.hidden = !newval)
      } else if ($attr._type === iterator) {
        $attr.value.subscribe(info => {
          if (info.action !== 'push') return
          info.append($el)
        })
      }
      else $el.setAttributeNode($attr)
    })
    const populate = child => {
      if (child !== $) {
        children.push(child)
        return populate
      }
      children.forEach(_child => {
        if (typeof _child === 'string') return $el.appendChild(text(_child))
        if (_child._type !== getter) {
          $el.appendChild(_child($))
        } else {
          const $child = text()
          _child.subscribe(newval => $child.textContent = newval)
          $el.appendChild($child)
        }
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
  window.img = el('img')
  window.input = el('input')
  window.button = el('button')
  window.header = el('header')
  window.article = el('article')
  window.section = el('section')

  window.click = on('click')
  window.submit = on('submit')
  window.onInput = on('input')

  window.src = attr('src')

  window.el = el
  window.on = on
  window.attr = attr
  window.cond = cond
  window.iter = iter
  window.array = array
  window.render = render
  window.makeState = makeState
})()
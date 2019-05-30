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

  const getter = Symbol('Getter')
  const iterator = Symbol('Iterator')
  const $ = Symbol()

  function chainable(type, produce) {
    const chained = []
    function chain(...args) {
      const [head, ...rest] = args
      if (head === $) return produce(chained, ...rest)
      chained.push(head)
      return chain
    }
    chain._type = type
    return chain
  }

  const populate = $el => chainable('populate', children => {
    children.forEach(_child => {
      if (typeof _child === 'string') $el.appendChild(text(_child))
      switch (_child._type) {
        case 'populate':
          $el.append(_child($))
          break;
        case 'when':
          $el.append(..._child($))
          break;
        case getter:
          const $child = text()
          _child.subscribe(newval => $child.textContent = newval)
          $el.appendChild($child)
          break;
      }
    })
    return $el
  })

  const on = name => first => chainable('on', (handlers, el) => {
    [first, ...handlers]
      .forEach(handler => el.addEventListener(name, e => handler(e)))
  })

  const when = exp => chainable('when', elements => {
    const $elements = elements.flatMap(el => el($))
    $elements.forEach(el => exp.subscribe(value => el.hidden = !value))
    return $elements
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
    const $el = document.createElement(name)
    attrs.forEach($attr => {
      if (typeof $attr === 'string') $el.classList.add($attr)
      else if ($attr._type === 'on') $attr($, $el)
      else if ($attr._type === iterator) {
        $attr.value.subscribe(info => {
          if (info.action !== 'push') return
          info.append($el)
        })
      }
      else $el.setAttributeNode($attr)
    })
    return populate($el)
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
  window.when = when
  window.iter = iter
  window.array = array
  window.render = render
  window.makeState = makeState
})()
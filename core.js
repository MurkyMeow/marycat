import { State } from './state.js';

export function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

function plain($el, str) {
  const [prefix, rest] = [str[0], str.slice(1)]
  switch (prefix) {
    case '.': return $el.classList.add(rest)
    case '#': return $el.setAttribute('id', rest)
    case '@': return $el.setAttribute('name', rest)
    default:
      return $el.appendChild(document.createTextNode(str))
  }
}

function observed(state, mount) {
  const nodes = [mount('')]
  state.sub(next => {
    // keep the first element to insert nodes after it
    while (nodes.length > 1) nodes.pop().remove()
    // what concat does: n -> [n]; [n] -> [n]
    const nextNodes = [].concat(mount(next))
    nextNodes.forEach((node, i) => {
      const previous = nextNodes[i - 1] || nodes.pop()
      previous.after(node)
      nodes.push(node)
      if (i === 0) previous.remove()
    })
  })
  return nodes
}

export function withParent($el) {
  return function mount(entity) {
    if (entity === null) return
    if (Array.isArray(entity)) {
      return entity.map(mount)
    }
    if (entity instanceof State) {
      return observed(entity, mount)
    }
    switch (typeof entity) {
      case 'number':
      case 'boolean':
        return $el.appendChild(document.createTextNode(entity))
      case 'string': return plain($el, entity)
      case 'function': return entity($el)
      default: throw Error(`Unexpected child: ${entity}`)
    }
  }
}

export const chainable = api => (...initial) => {
  const chained = []
  function chain(first, ...rest) {
    if (first instanceof Node) {
      return chain._connect(first, chained)
    }
    if (chain._take) chain._take(first, ...rest)
    else chained.push(first, ...rest)
    return chain
  }
  const { _init, ...rest } = api
  Object.assign(chain, rest)
  if (_init) {
    _init.apply(chain, initial)
    return chain
  }
  return initial.length > 0
    ? chain(...initial) : chain
}

export function el(name, api = {}) {
  const { _attrs = [], _events = [], ...rest } = api
  return chainable({
    _connect($parent, chained) {
      const $el = document.createElement(name)
      const mount = withParent($el)
      chained.forEach(mount)
      return $parent.appendChild($el)
    },
    prevent() {
      this.prevented = true
      return this
    },
    stop() {
      this.stopped = true
      return this
    },
    on(name, handler) {
      const handle = this.prevented
        ? this.stopped
          ? (e => (e.preventDefault(), e.stopPropagation(), handler(e)))
          : (e => (e.preventDefault(), handler(e)))
        : handler
      this.stopped = this.prevented = false
      this($el => $el.addEventListener(name, handle))
      return this
    },
    attr(name, value) {
      const attr = document.createAttribute(name)
      if (value instanceof State) {
        value.sub(next => attr.value = next)
      } else {
        attr.value = value
      }
      this($el => $el.setAttributeNode(attr))
      return this
    },
    ..._events.reduce((acc, evt) => ({ ...acc,
      [evt]: function(handler) { return this.on(evt, handler) }
    }), {}),
    ..._attrs.reduce((acc, attr) => ({ ...acc,
      [attr]: function(value) { return this.attr(attr, value) }
    }), {}),
    ...rest,
  })
}

export const fragment = el('', {
  _connect($parent, chained) {
    const mount = withParent($parent)
    mount(chained)
  },
})

export function empty() {
  return document.createComment('')
}

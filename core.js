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

export function withParent($el) {
  return function mount(entity) {
    if (entity === null) return
    if (Array.isArray(entity)) {
      return entity.map(mount)
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
    if (first instanceof Element) {
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
    on(name, handler) {
      const handle = this.prevented
        ? e => (e.preventDefault(), handler(e))
        : handler
      this.prevented = false
      this($el => $el.addEventListener(name, handle))
      return this
    },
    attr(name, value) {
      this($el => $el.setAttribute(name, value))
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

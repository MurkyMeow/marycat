function assert(cond, msg) {
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
    if (chain._take) {
      return chain._take(first, ...rest)
    }
    chained.push(first, ...rest)
    return chain
  }
  const { _init, ...rest } = api
  Object.assign(chain, rest)
  if (_init) {
    _init.apply(chain, initial)
    return chain
  }
  return chain(...initial)
}

export const el = (name, api = {}) => chainable({
  ...api,
  _connect($parent, chained) {
    const $el = document.createElement(name)
    const mount = withParent($el)
    chained.forEach(mount)
    return $parent.appendChild($el)
  },
  on(name, handler) {
    this($el => $el.addEventListener(name, handler))
    return this
  },
  attr(name, handler) {
    this($el => $el.setAttribute(name, handler))
    return this
  },
})

export function empty() {
  return document.createComment('')
}

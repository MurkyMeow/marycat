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

const el = name => (...entities) => {
  const chained = entities
  return function chain(...entities) {
    const $parent = entities.find(x => x instanceof Element)
    if (!$parent) {
      chained.push(...entities.flat())
      return chain
    }
    const $el = document.createElement(name)
    chained.forEach(entity => {
      switch (typeof entity) {
        case 'string': return plain($el, entity)
        case 'function': return entity($el, chain)
        default: throw Error(`Unexpected child: ${entity}`)
      }
    })
    return $parent.appendChild($el)
  }
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
      if (value === current) return
      current = value
      observers.forEach(cb => cb(value))
    }
  })
  subscribe.after = f => {
    const newState = makeState(current)
    subscribe(value => newState.value = f(value))
    return newState
  }
  return subscribe
}

const on = name => handler => $el => {
  $el.addEventListener(name, handler)
}

const attr = name => value => $el => {
  $el.setAttribute(name, value)
}
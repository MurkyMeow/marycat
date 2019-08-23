import { State } from './state.js';

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
      case 'function': return entity.connect
        ? entity.connect($el)
        : entity($el)
      default: throw Error(`Unexpected child: ${entity}`)
    }
  }
}

export const chainable = api => (...initial) => {
  function chain(...args) {
    if (chain.take) chain.take(...args)
    else if (chain.el) chain.mount(...args)
    else chain.chained.push(...args)
    return chain
  }
  const { init, ...rest } = api
  Object.assign(chain, rest, {
    chained: [],
    baseInit: () => chain(...initial),
  })
  if (init) {
    init.apply(chain, initial)
    return chain
  }
  return initial.length > 0
    ? chain.baseInit() : chain
}

const defaultEvents = [
  'click', 'dblclick',
  'mousedown', 'mouseenter', 'mouseleave',
  'mousemove', 'mouseout', 'mouseover', 'mouseup',
  'keyup', 'keydown', 'keypress',
  'drag', 'dragenter', 'dragexit', 'dragleave',
  'dragover', 'dragstart', 'dragend', 'drop',
  'input', 'scroll', 'submit', 'focus', 'blur',
]
const defaultAttrs = [
  'id', 'class',
  'role', 'tabindex', 'hidden',
]

function setAttribute($el, name, value) {
  if (typeof value === 'object') {
    $el.props[name].v = value
  } else {
    $el.setAttribute(name, value)
  }
}

export function el(name, api = {}) {
  const { attrs = [], events = [], ...rest } = api
  const _attrs = [...defaultAttrs, ...attrs]
  const _events = [...defaultEvents, ...events]
  return chainable({
    [api.connect ? 'baseConnect' : 'connect']($parent, $node) {
      this.el = $node || document.createElement(name)
      this.mount = withParent(this.el)
      this.chained.forEach(this.mount)
      return $parent.appendChild(this.el)
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
      const handle = [handler]
      if (this.prevented) handle.unshift(e => e.preventDefault())
      if (this.stopped) handle.unshift(e => e.stopPropagation())
      this.stopped = this.prevented = false
      return this($el => {
        $el.addEventListener(name, e => handle.forEach(fn => fn(e)))
      })
    },
    emit(name, detail, opts = {}) {
      return this($el => {
        const event = new CustomEvent(name, { detail, ...opts })
        const el = $el instanceof ShadowRoot ? $el.host : $el
        el.dispatchEvent(event)
      })
    },
    attr(name, value = '') {
      return this($el => {
        const el = $el instanceof ShadowRoot ? $el.host : $el
        if (value instanceof State) {
          value.sub(next => setAttribute(el, name, next))
        } else {
          setAttribute(el, name, value)
        }
      })
    },
    style(rule, value) {
      return this($el => value instanceof State
        ? value.sub(v => $el.style[rule] = v)
        : $el.style[rule] = value
      )
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
  connect($el) {
    [this.el, this.mount] = [$el, withParent($el)]
    this.mount(this.chained)
  },
})

export function empty() {
  return document.createComment('')
}

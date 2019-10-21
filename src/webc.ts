import { State, ExtractStateType } from './state'
import { PipeFn, mount, _, fragment, shorthand } from './core'

type Converter =
  StringConstructor |
  NumberConstructor |
  BigIntConstructor |
  BooleanConstructor

function getConverter(type: string): Converter | undefined {
  switch (type) {
    case 'bigint': return BigInt
    case 'number': return Number
    case 'string': return String
    case 'boolean': return Boolean
  }
}

let props: { [key: string]: State<any> }
let keys: string[]

export function defAttr<T>(defaultValue: T): State<T> {
  const [current] = keys.slice(-1)
  props[current] = new State(defaultValue)
  return props[current]
}

export class MaryElement extends HTMLElement {
  root: ShadowRoot = this.attachShadow({ mode: 'open' })
  props: { [key: string]: State<unknown> } = {}
  constructor(
    private render: (host: PipeFn, props: any) => PipeFn,
  ) {
    super()
    const observer = new MutationObserver(changes => changes.forEach(x => {
      const name = x.attributeName!
      const prop = this.props[name]
      const val = this.getAttribute(name)
      const converter = getConverter(typeof prop.v)
      if (converter) prop.v = converter(val)
      else console.trace(val, 'is not assignable to', `"${name}"`, 'of', this)
    }))
    observer.observe(this, { attributes: true })
  }
  connectedCallback() {
    props = {}, keys = []
    const trap = new Proxy({}, {
      get: (_, key: string) => void keys.push(key),
    })
    const children = this
      .render(fragment(), <any>trap)
    this.props = props
    mount(this.root, children)
  }
}

export const customElement = <T>(
  elName: string,
  render: (host: PipeFn, props: T) => PipeFn,
) => {
  customElements.define(elName, class extends MaryElement {
    constructor() { super(render) }
  })
  return {
    new: shorthand(elName),
    prop: <K extends keyof T>(
      key: K,
      val: T[K] | ExtractStateType<T[K]>,
    ) => (el: Element | ShadowRoot) => {
      const sKey = <string>key
      const comp = <MaryElement>el
      if (typeof val !== 'object') {
        comp.setAttribute(sKey, String(val))
      } else if (val instanceof State) {
        val.sub(next => comp.props[sKey].v = next)
      } else {
        comp.props[sKey].v = val
      }
    },
  }
}

import { State } from './state'
import { MaryElement, fragment, Effect, div } from './core'

class MaryComponent extends HTMLElement {
  props: { [key: string]: State<Primitive> } = {}
  converters: { [key: string]: (v: string) => Primitive } = {}
  constructor() {
    super()
    const root = this.attachShadow({ mode: 'open' })
    if (this.css) {
      const style = document.createElement('style')
      style.append(this.css)
      root.append(style)
    }
  }
  get css(): string {
    return ''
  }
  attributeChangedCallback(name: string, _: string, val: string) {
    const prop = this.props[name]
    const converter = this.converters[name]
    prop.v = converter ? converter(val) : val
  }
}

type Converter =
  StringConstructor |
  NumberConstructor |
  BigIntConstructor |
  BooleanConstructor

type Primitive = string | number | boolean | bigint

type Props = { [key: string]: State<Primitive> }

export function webc(
  name: string,
  args: {
    css?: string,
    attributes: { [key: string]: [Converter, Primitive] | Converter },
    render: (host: MaryElement, props: Props) => MaryElement,
  },
) {
  const attributeNames = Object.keys(args.attributes)
  customElements.define(name, class extends MaryComponent {
    get css() {
      return args.css || ''
    }
    static get observedAttributes() {
      return attributeNames
    }
  })
  class Chainable extends MaryElement {
    constructor(chain: Effect[]) {
      super(name, chain)
    }
    mount(parent: Element | ShadowRoot) {
      const el = this.el = <MaryComponent>document.createElement(name)
      Object.entries(args.attributes).forEach(([key, attr]) => {
        const [converter, initial] = Array.isArray(attr)
          ? attr
          : [attr, '']
        el.props[key] = new State(initial)
        el.converters[key] = converter
      })
      this.$(args.render(fragment(), el.props))
      return super.mount(parent)
    }
  }
  return (...effects: Effect[]) => new Chainable(effects)
}

import { PipeFn, on, styleEl, customElement, mount, TypedDispatch, watch } from '../src/index'
import { div, span } from './bindings'
import { observable } from '@nx-js/observer-util'

type Dispatch =
  TypedDispatch<{ change: number }>

interface Props {
  supercool: boolean
  logo: { title: string, icon: string }
}

function viewExample(host: PipeFn<ShadowRoot>, props: Props, t_dispatch: Dispatch) {
  const state = observable({ count: 0 })
  return host
  (on('click', () => {
    state.count++
    props.logo.icon = '👁‍'
    host(t_dispatch('change', state.count))
  }))
  (styleEl(`
    span { color: red; }
  `))
  (span()
    (watch(() => `You clicked ${state.count} times`))
  )
  (div()
    (watch(() => `${props.logo.icon} ${props.logo.title}`))
  )
  (watch(() => props.supercool && [
    div('💫 ⭐️ 🌟 ✨'),
    div('⚡️ ☄️ 💥 🔥'),
  ]))
}
const example = customElement('mary-example', viewExample)

mount(document.body,
  (example.new('.classname')
    (example.prop('supercool', true))
    (example.prop('logo', { title: 'web component', icon: '🌞' }))
    // ts infers that the detail is a number
    (example.on('change', e => console.log(e.detail - 5)))
  )
)

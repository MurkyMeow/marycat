import { PipeFn, defAttr, State, on, styleEl, zip$, customElement, mount, TypedDispatch } from '../src/index'
import { div, span } from './bindings'

type ExampleDispatch =
  TypedDispatch<{ change: number }>

function viewExample(host: PipeFn<ShadowRoot>, {
  supercool = defAttr(false),
  logo = defAttr({ title: '', icon: '' }),
}, t_dispatch: ExampleDispatch) {
  const count = new State(0).sub(val => {
    host(t_dispatch('change', val))
  })
  return host
  (on('click', () => {
    count.v++
    logo.v = { ...logo.v, icon: '👁‍' }
  }))
  (styleEl()(`
    span { color: red; }
  `))
  (span()(zip$`You clicked ${count.string} times`))
  (div()(zip$`${logo._.icon} ${logo._.title}`))
  (supercool.and([
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

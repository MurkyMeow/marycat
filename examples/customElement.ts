import { PipeFn, defAttr, State, dispatch, on, styleEl, zip$, customElement, mount } from '../src/index'
import { div, span } from './bindings'

function renderExample(host: PipeFn, {
  supercool = defAttr(false),
  logo = defAttr({ title: '', icon: '' }),
}) {
  const count = new State(0).sub(val => {
    host(dispatch('change', val))
  })
  return host
  (on('click', () => {
    count.v++
    logo.v = { ...logo.v, icon: '👁‍' }
  }))
  (styleEl()(`
    span { color: red; }
  `))
  (span()(zip$`You clicked ${count.map(String)} times`))
  (div()(zip$`${logo._.icon} ${logo._.title}`))
  (supercool.and([
    div('💫 ⭐️ 🌟 ✨'),
    div('⚡️ ☄️ 💥 🔥'),
  ]))
}
const example = customElement('mary-example', renderExample)

mount(document.body,
  (example.new('.classname')
    (example.prop('supercool', true))
    (example.prop('logo', { title: 'web component', icon: '🌞' }))
    (on('change', console.log))
  )
)

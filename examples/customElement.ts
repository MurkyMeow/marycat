import { VirtualNodeFn, State, style, customElement, Attr, zip$ } from '../src/index'
import { div, span } from './bindings'

function renderExample(host: VirtualNodeFn, {
  supercool = Attr(false),
  logo = Attr({ title: '', icon: '' }),
}) {
  const count = new State(0).sub(val => {
    host.dispatch('change', val)
  })
  return host
  .on('click', () => {
    count.v++
    logo.v = { ...logo.v, icon: '👁‍' }
  })
  (style()(`
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

example('.classname')
  .prop('supercool', true)
  .prop('logo', { title: 'web component', icon: '🌞' })
  .on('change', e => {
    console.log((e as CustomEvent).detail)
  })
  .mount(document.body)

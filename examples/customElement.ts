import { VirtualNode, State, style, customElement, Attr } from '../index'
import { div, span } from './bindings'

function renderExample(host: VirtualNode, {
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
  .$(style().text$`
    span {
      color: red;
    }
  `)
  .$(span().text$`You clicked ${count.map(String)} times`)
  .$(div().text$`${logo._.icon} ${logo._.title}`)
  .$(supercool.and([
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

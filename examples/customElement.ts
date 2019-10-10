import { State, style, customElement, Attr } from '../index'
import { div, span } from './bindings'
import { Props } from '../webc'

interface ExampleProps {
  supercool: boolean
  logo: { title: string, icon: string }
}
const example = customElement('mary-example', (host, {
  supercool = Attr('supercool', Boolean),
  logo = Attr('logo'),
}: Props<ExampleProps>) => {
  const count = new State(0).sub(val => {
    host.emit('change', val)
  })
  return host
  .on('click', () => {
    count.v++
    logo._`icon`.v = '👁‍'
  })
  .$(style().text`
    span {
      color: red;
    }
  `)
  .$(span().text`You clicked ${count.map(String)} times`)
  .$(div().text`${logo._`icon`} ${logo._`title`}`)
  .$(supercool.and([
    div('💫 ⭐️ 🌟 ✨'),
    div('⚡️ ☄️ 💥 🔥'),
  ]))
})

example('.classname')
  .prop('supercool', true)
  .prop('logo', { title: 'web component', icon: '🌞' })
  .on('change', e => {
    console.log((e as CustomEvent).detail)
  })
  .mount(document.body)

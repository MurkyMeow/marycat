import { State, style, customElement, Attr } from '../index'
import { div, span } from './bindings'

type Logo = { title: string, icon: string }

const example = customElement('mary-example', {
  observed: ['supercool', 'logo'],
  render(host,
    supercool: State<boolean> = Attr('supercool', Boolean),
    logo: State<Logo> = Attr('logo'),
  ) {
    const count = new State(0).sub(val => {
      host.emit('change', val)
    })
    host.on('click', () => {
      count.v++
      logo._`icon`.v = '👁‍'
    })
    return host
    .$(style().text`
      span {
        color: red;
      }
    `)
    .$(span().text`You clicked ${count.map(String)} times`)
    .$(div().text`${logo._`icon`} ${logo._`title`}`)
    .$(supercool.and([
      div('💫 ⭐️ 🌟 ✨'),
      div('⚡️ ☄️ 💥 🔥')
    ]))
  },
})

example('.classname')
  .attr('supercool', true)
  .attr('logo', { title: 'web component', icon: '🌞' })
  .on('change', e => {
    console.log((e as CustomEvent).detail)
  })
  .mount(document.body)

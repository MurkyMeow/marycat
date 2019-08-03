import { State } from '../state.js'
import { _if } from '../if.js'

const animationFrame = () => new Promise(res => requestAnimationFrame(res))

describe('if', function() {
  const cond = new State(true)
  const children = mount(
    (_if(cond)
      (div('then'))
      (div('then2'))
    .else()
      (div('else'))
    )
  )
  it('renders nodes properly', async function() {
    await animationFrame()
    assert(children.length === 2, 'The amount of children doesnt match')
    assert(
      children[0].textContent === 'then' &&
      children[1].textContent === 'then2',
    )
  })
  it('responds to condition changes', async function() {
    cond.v = false
    await animationFrame()
    assert(children.length === 1 && children[0].textContent,
      '`else` doesnt seem to work'
    )
  })
})

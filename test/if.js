import { State } from '../state.js'
import { _if } from '../if.js'

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
  it('renders the right nodes', async function() {
    await animationFrame()
    expect(children.length).to.equal(2)
    expect(children[0].textContent).to.equal('then')
    expect(children[1].textContent).to.equal('then2')
  })
  it('responds to a condition change', async function() {
    cond.v = false
    await animationFrame()
    expect(children.length).to.equal(1)
    expect(children[0].textContent).to.equal('else')
  })
})

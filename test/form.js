import { State } from '../state.js'
import { form, input }  from '../form.js'

describe('input', function() {
  const state = new State('foo')
  let $node
  it('binds a state to an input', function() {
    $node = mount(input().bind(state))
    expect($node.value).to.equal('foo')
  })
  it.skip('changes the state when typing', function() {
  })
})

describe('form', function() {
  const initial = { meow: 'meowww', purr: 'purrr' }
  const state = new State(initial)
  let $node
  it('binds a state to a form', async function() {
    $node = mount(
      form().bind(state)
        (input('@meow'))
        (input('@purr'))
    )
    await animationFrame()
    const data = new FormData($node)
    expect(data.get('meow')).to.equal(initial.meow)
    expect(data.get('purr')).to.equal(initial.purr)
  })
  it.skip('changes the state as the inputs change', function() {
  })
})

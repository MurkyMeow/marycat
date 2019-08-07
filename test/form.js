import { State } from '../state.js'
import { form, input }  from '../form.js'

describe('input', function() {
  describe('bind', function() {
    const state = new State('foo')
    let $node
    it('binds a state to an input', function() {
      $node = mount(input().bind(state))
      expect($node.value).to.equal('foo')
    })
    it.skip('changes the state when typing')
  })
  describe('validity', function() {
    const state = new State('foo')
    let $node
    it('sets a custom validity message', function() {
      $node = mount(input().validity(state))
      expect($node.validationMessage).to.equal('foo')
    })
    it('updates the validity message', function() {
      state.v = ''
      expect($node.validationMessage).to.equal('')
    })
  })
})

describe('form', function() {
  describe('bind', function() {
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
    it.skip('changes the state as the inputs change')
  })
})

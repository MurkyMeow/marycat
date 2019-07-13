import { State } from '../state.js'
import { form, input }  from '../form.js'

it('checks if `bind` works with <input>', function() {
  const state = new State('foo')
  const $node = mount(input().bind(state))
  assert($node.value === 'foo', 'Initial value is not applied')
  // TODO: simulate keyboard input somehow?
})

it('checks if `bind` works with <form>', function() {
  const initial = { meow: 'meowww', purr: 'purrr' }
  const state = new State(initial)
  const $node = mount(
    form().bind(state)
      (input('@meow'))
      (input('@purr'))
  )
  const data = new FormData($node)
  assert(
    data.get('meow') === initial.meow &&
    data.get('purr') === initial.purr,
    'Initial values are not applied'
  )
  // TODO: simulate keyboard input somehow?
})

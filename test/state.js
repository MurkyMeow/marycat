const { makeState, get } = marycat

describe('state', function() {
  it('ensures state callbacks are called', function() {
    const state = makeState(25)
    const values = []
    state(val => values[0] = val)
    state(val => values[1] = val)
    assert(values.every(x => x === 25), 'Initial value is not applied')
    state.value = 'foo'
    assert(values.every(x => x === 'foo'), 'Value updates are not applied')
  })

  it('ensures `get` works properly', function() {
    const state = makeState('foo')
    const state2 = makeState('bar')
    const $node = mount(
      div(get`state=${state};state2=${state2}`)
    )
    assert(
      $node.textContent === 'state=foo;state2=bar',
      'Initial values are not applied'
    )
    state.value = 'baz'
    state2.value = 'qux'
    assert(
      $node.textContent === 'state=baz;state2=qux',
      'State updates are not applied'
    )
  })

  it.skip('checks if `bind` works with <input>', function() {
    const state = makeState('foo')
    const $node = mount(input().bind(state))
    assert($node.value === 'foo', 'Initial value is not applied')
    // TODO: simulate keyboard input somehow?
  })

  it.skip('checks if `bind` works with <form>', function() {
    const initial = { meow: 'meowww', purr: 'purrr' }
    const state = makeState(initial)
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

  it('checks if `when` works as designed', function() {
    const cond = makeState(true)
    const cond2 = makeState(false)
    const $node = mount(
      div()
        (div().when(cond))
        (div().when(cond2))
        (div().when(cond, cond2))
        (div().when(cond).when(cond2))
    )
    const [shown, hidden, or, and] = $node.children
    assert(!shown.hidden, 'When true the node should not be hidden')
    assert(hidden.hidden, 'When false the node should be hidden')
    assert(!or.hidden, 'OR with comma notation doesnt work')
    assert(and.hidden, 'AND with chain notation doesnt work')

    cond.value = false
    assert(shown.hidden, 'Changing condition has no effect')
    assert(or.hidden, 'OR doesnt track updates')

    cond.value = cond2.value = true
    assert(!and.hidden, 'AND doesnt track updates')
  })
})

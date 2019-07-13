import { State } from '../state.js'
import { _if } from '../if.js'

describe('if', function() {
  it('ensures `if` renders nodes properly', function() {
    const cond = new State(true)
    const $node = mount(
      (_if(cond)
        (div('then'))
        (div('then2'))
      .else()
        (div('else'))
      )
    )
    assert($node.children.length === 2, 'The amount of children doesnt match')
    assert(
      $node.children[0].textContent === 'then' &&
      $node.children[1].textContent === 'then2',
      'The children are not in their place'
    )
    cond.v = false
    assert($node.children.length === 1, 'The amount of `else` children doesnt match')
    assert($node.children[0].textContent === 'else', '`else` renders a wrong child')
  })
})

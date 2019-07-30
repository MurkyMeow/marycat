import { State } from '../state.js'

describe('mount', function() {
  it('renders different nodes', function() {
    const $node = mount(
      div()
        (h3())
        (button())
        (article())
    )
    const { children } = $node
    assert($node.tagName === 'DIV', 'The root node should be a div')
    assert(children.length === 3, 'The amount of nodes doesnt match')
    assert(children[0].tagName === 'H3', 'The first node should be an h3')
    assert(children[1].tagName === 'BUTTON', 'The second node should be a button')
    assert(children[2].tagName === 'ARTICLE', 'The third node should be an article')
  })

  it('appends class names', function() {
    const $node = mount(div('.c1', '.c2')('.c3')('.c4'))
    const { classList } = $node
    assert(
      classList.contains('c1') && classList.contains('c2'),
      'Comma notation doesnt work'
    )
    assert(
      classList.contains('c3') && classList.contains('c4'),
      'Chain notation doesnt work'
    )
  })

  it('sets id and name', function() {
    const $node = mount(div('#foo')('@bar'))
    assert($node.getAttribute('id') === 'foo', 'id is not set')
    assert($node.getAttribute('name') === 'bar', 'name is not set')
  })
  
  it('registers click events', function() {
    let count = 0
    const $node = mount(
      div()
        .on('click', () => count += 2)
        .on('click', () => count += 3)
    )
    $node.click()
    assert(count === 5, 'Click handlers are not called')
  })

  it('registers custom event', function() {
    let catched
    const $node = mount(
      div().on('custom-evt', e => catched = e)
        (div())
    )
    const event = new CustomEvent('custom-evt', { bubbles: true })
    $node.children[0].dispatchEvent(event)
    assert(catched.type === 'custom-evt')
  })
})
describe('mount state', function() {
  const el = new State(div())
  let mounting

  it('mounts the state-wrapped div', function() {
    mounting = mount(el)
    assert(mounting[0] && mounting[0].tagName === 'DIV')
  })
  it('responds to the state change', function() {
    el.v = h3()
    assert(mounting[0] && mounting[0].tagName === 'H3')
  })
})


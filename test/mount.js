describe('mount', function() {
  it('renders different nodes', function() {
    const $node = mount(
      div()
        (h3())
        (input())
        (article())
    )
    const { children } = $node
    assert(children.length === 3, 'The amount of nodes doesnt match')
    assert(children[0].tagName === 'H3', 'The first node should be an h3')
    assert(children[1].tagName === 'INPUT', 'The second node should be an input')
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
    assert($node.id === 'foo', 'id is not set')
    assert($node.name === 'bar', 'name is not set')
  })
  
  it('registers click events', function() {
    let count = 0
    const $node = mount(
      div()
        .click(() => count += 2)
        .click(() => count += 3)
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

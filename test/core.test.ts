import { assert } from 'chai'
import { mount, style, on, dispatch, text } from '../src/index'
import { div } from '../examples/bindings'

describe('core', function() {
  it('mount an element', function() {
    const [el] = mount(document.head, div())
    assert.strictEqual(el.nodeName, 'DIV')
  })

  it('append children', function() {
    const [el] = mount(document.head, div()
      (div())
      (div())
    )
    assert.strictEqual(el.children.length, 2)
  })

  it('set common attributes with their shorthands', function() {
    const [el] = mount(document.head, div('foo', '#bar', '@baz', '.qux'))
    assert.strictEqual(el.textContent, 'foo')
    assert.strictEqual(el.getAttribute('id'), 'bar')
    assert.strictEqual(el.getAttribute('name'), 'baz')
    assert.strictEqual(el.getAttribute('class'), 'qux')
  })

  it('set text', function() {
    const [el] = mount(document.head, div()
      (text('foobar'))
    )
    assert.strictEqual(el.textContent, 'foobar')
  })

  it('append class names', function() {
    const [el] = mount(document.head, div('.c1', '.c2'))
    assert.includeMembers([...el.classList], ['c1', 'c2'])
  })

  it('set style properties', function() {
    const [el] = mount(document.body, div() 
      (style('color', 'red'))
      (style('font-size', '12px'))
    )
    assert.strictEqual(el.getAttribute('style'), 'color: red; font-size: 12px;')
  })

  it('register click events', function() {
    let count = 0
    const [el] = mount(document.head, div()
      (on('click', () => count += 2))
      (on('click', () => count += 3))
    )
    el.click()
    assert.strictEqual(count, 5)
  })

  it('emit a custom event', function() {
    let catchedEvent: CustomEvent | undefined
    const child = div()
    mount(document.head, div()
      (child)
      (on('custom-evt', (e: Event) => catchedEvent = e as CustomEvent))
    )
    child(dispatch('custom-evt', 1234, { bubbles: true }))
    if (catchedEvent) {
      assert.strictEqual(catchedEvent.type, 'custom-evt')
      assert.strictEqual(catchedEvent.detail, 1234)
    } else {
      assert.fail()
    }
  })
})

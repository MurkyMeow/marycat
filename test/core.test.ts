import { assert } from 'chai'
import { _, mount, style, on, dispatch } from '../src/index'
import { div } from '../examples/bindings'

describe('core', function() {
  it('mount an element', function() {
    const el = mount(document.head, div())
    assert.strictEqual(el.nodeName, 'DIV')
  })

  it('append children', function() {
    const el = mount(document.head, div()
      (div())
      (div())
    )
    assert.strictEqual(el.children.length, 2)
  })

  it('set text content, name and id', function() {
    const el = <Element>mount(document.head, div('foo', '#bar', '@baz'))
    assert.strictEqual(el.textContent, 'foo')
    assert.strictEqual(el.getAttribute('id'), 'bar')
    assert.strictEqual(el.getAttribute('name'), 'baz')
  })

  it('append class names', function() {
    const el = <Element>mount(document.head, div('.c1', '.c2'))
    assert.includeMembers([...el.classList], ['c1', 'c2'])
  })

  it('set style properties', function() {
    const el = <Element>mount(document.body, div()
      (style('color', 'red'))
      (style('font-size', '12px'))
    )
    assert.strictEqual(el.getAttribute('style'), 'color: red; font-size: 12px;')
  })

  it('register click events', function() {
    let count = 0
    const el = <HTMLElement>mount(document.head, div()
      (on('click', () => count += 2))
      (on('click', () => count += 3))
    )
    el.click()
    assert.strictEqual(count, 5)
  })

  it('emit a custom event', function() {
    let catched: CustomEvent
    const child = div()
    mount(document.head, div()
      (child)
      (on('custom-evt', (e: Event) => catched = <CustomEvent>e))
    )
    child(dispatch('custom-evt', 1234, { bubbles: true }))
    assert.strictEqual(catched!.type, 'custom-evt')
    assert.strictEqual(catched!.detail, 1234)
  })
})

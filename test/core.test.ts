import { assert } from 'chai'
import { mount, style, on, dispatch } from '../src/index'
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
    const el = mount(document.head, div('foo', '#bar', '@baz')) as Element
    assert.strictEqual(el.textContent, 'foo')
    assert.strictEqual(el.getAttribute('id'), 'bar')
    assert.strictEqual(el.getAttribute('name'), 'baz')
  })

  it('append class names', function() {
    const el = mount(document.head, div('.c1', '.c2')) as Element
    assert.includeMembers([...el.classList], ['c1', 'c2'])
  })

  it('set style properties', function() {
    const el = mount(document.body, div() 
      (style('color', 'red'))
      (style('font-size', '12px'))
    ) as Element
    assert.strictEqual(el.getAttribute('style'), 'color: red; font-size: 12px;')
  })

  it('register click events', function() {
    let count = 0
    const el = mount(document.head, div()
      (on('click', () => count += 2))
      (on('click', () => count += 3))
    ) as HTMLElement
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

import test from 'tape'
import { div, h1 } from '../core'
import { stateful } from '../state'

test('mount an element', assert => {
  assert.plan(1)
  const el = div().mount(document.head)
  assert.equal(el.nodeName, 'DIV')
})

test('append children', assert => {
  assert.plan(1)
  const el = div()
    ._(div())
    ._(div())
    .mount(document.head)
  assert.equal(el.children.length, 2)
})

test('set text content, name and id', assert => {
  assert.plan(3)
  const el = <Element>div('baz', '#bar', '@baz').mount(document.head)
  assert.equal(el.textContent, 'baz')
  assert.equal(el.getAttribute('id'), 'bar')
  assert.equal(el.getAttribute('name'), 'baz')
})

test('append class names', assert => {
  assert.plan(1)
  const el = <Element>div('.c1', '.c2')
    ._('.c3')
    ._('.c4')
    .mount(document.head)
  assert.isEquivalent(el.classList, ['c1', 'c2', 'c3', 'c4'])
})

test('set style properties', assert => {
  assert.plan(1)
  const el = <Element>div()
    .style('color', 'red')
    .style('fontSize', '12px')
    .mount(document.head)
  assert.equal(el.getAttribute('style'), 'color: red; font-size: 12px;')
})

test('register click events', assert => {
  assert.plan(1)
  let count = 0
  const el = <HTMLElement>div()
    .on('click', () => count += 2)
    .on('click', () => count += 3)
    .mount(document.head)
  el.click()
  assert.equal(count, 5)
})

test('emit a custom event', assert => {
  assert.plan(3)
  let catched: CustomEvent
  const child = div()
  div().on('custom-evt', e => catched = <CustomEvent>e)
    ._(child)
    .mount(document.head)
  child.emit('custom-evt', 1234, { bubbles: true })
  assert.equal(catched!.type, 'custom-evt')
  assert.equal(catched!.detail, 1234)
})

test('mount a stateful element', assert => {
  assert.plan(2)
  const state = stateful(div())
  const el = div()
    ._(state)
    .mount(document.head)
  assert.equal(el.firstChild && el.firstChild.nodeName, 'DIV')
  state.v = h1()
  assert.equal(el.firstChild && el.firstChild.nodeName, 'H1')
})

test('set a reactive attribute', assert => {
  assert.plan(2)
  const state = stateful('foo')
  const el = <Element>div()
    .attr$('class')`__${state}__`
    .mount(document.head)
  assert.equal(el.className, '__foo__')
  state.v = 'bar'
  assert.equal(el.className, '__bar__')
})

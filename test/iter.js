import { State, get, iter } from '../index.js'

describe('iter', function() {
  const items = new State(['a', 'b', 'c'])
  let $nodes
  async function check() {
    await animationFrame()
    expect($nodes).to.have.length(items.v.length)
    for (const i of Array(items.v.length).keys()) {
      const { textContent } = $nodes[i]
      expect(textContent).to.equal(`${i} - ${items.v[i]}`)
    }
  }
  it('renders 3 nodes', async function() {
    $nodes = mount(
      iter(items, (item, i) =>
        div(get`${i} - ${item}`)
      )
    )
    await check()
  })
  it('reverses the nodes twice', async function() {
    for (const _ of Array(2).fill()) {
      items.v = [...items.v].reverse()
      await check()
    }
  })
  it('removes a node', async function() {
    items.v = items.v.filter((_, i) => i !== 1)
    await check()
  })
  it('appends nodes', async function() {
    items.v = [...items.v, 'd', 'e']
    await check()
  })
})
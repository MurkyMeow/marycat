import { State, on, zip$, repeat, mount } from '../src/index'
import { div, h3, button } from './bindings'

const items = [
  { name: 'Crown', view: '👑' },
  { name: 'Kimono', view: '👘' },
  { name: 'Cute ribbon', view: '🎀' },
  { name: 'Sweet dress', view: '👗' },
  { name: 'A pair of sneakers', view: '👟' },
  { name: 'Weird looking necklace', view: '📿' },
]

const randomItem = () =>
  items[items.length * Math.random() | 0]

const suit = new State([] as typeof items)

const app =
  div()
    (h3('What to wear'))
    (button()
      (on('click', () => {
        const amount = Math.random() * 5 | 0 + 1
        const newsuit = Array(amount).fill(0).map(randomItem)
        suit.v = [...new Set(newsuit)] // remove duplicates
      }))
      (suit.map(x => String(x.length > 0 ? 'Something else...' : 'Pick')))
    )
    (repeat(suit, item => item.name, item =>
      div('.suit-item')(zip$`${item._.name} ${item._.view}`)
    ))
mount(document.body, app)

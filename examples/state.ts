import { makeStore } from '../src/state2'
import { shorthand, cx, on, mount } from '../src/index'

const div = shorthand('div')
const button = shorthand('button')

const myStore = makeStore({
  count: 0,
}, store => ({
  increment() {
    myStore.set('count', store.count + 1)
  },
}))

const app =
  (div(cx`app`)
    (div()
      (myStore.attr('count', 'data-count'))
      (myStore.text('count'))
    )
    (button('increment')
      (on('click', myStore.increment))
    )
  )

mount(document.body, app)

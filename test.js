const counterState = makeState({
  count: 0,
})

setInterval(() => counterState.set('count', v => v + 10), 1500)

const _counter = ({ get, set }) => {
  const countView = get('count', v => `Current value: ${v}`)
  const increment = () => set('count', v => v + 1)
  return (
    div('counter', attr('data-count', get('count')))
      (div('counter__text')(countView))
      (button('counter__button', on('click', increment))('increment'))
  )
}
const counter = counterState.wire(_counter)

const app = () =>
  div('app')
    (header('app__header')
      (div('app__header-inner-a')('header-a'))
      (div('app__header-inner-b')('header-b'))
    )
    (article('app__content')
      (section('app__content-a')('content-a'))
      (section('app__content-b')('content-b'))
      (counter()
        (div()('Whoa!'))
      )
    )

render(app(), document.body);
const counterState = makeState((get, set) => ({
  count: 0,
  _view: {
    get count() {
      return get('count', v => `Current value: ${v}`);
    },
  },
  _action: {
    increment() {
      set('count', v => v + 1);
    },
  },
}))

const _counter = ({ state, view, action }) =>
  div('counter', attr('data-count', state.count))
    (div('counter__text')(view.count))
    (button('counter__button', click(action.increment))
      ('increment')
    )

const counter = counterState.wire(_counter)

const appState = makeState((get, set) => ({
  text: '',
  _action: {
    setText: e => set('text', e.target.value),
  }
}))

const _app = ({ state, action }) =>
  div('app')
    (header('app__header')
      (div('app__header-inner-a')('header-a'))
      (div('app__header-inner-b')('header-b'))
    )
    (article('app__content')
      (section('app__content-a')('content-a'))
      (section('app__content-b')('content-b'))
      (counter()('Whoa!'))
    )
    (article('app__content')
      (div()(state.text))
      (input(onInput(action.setText)))
    )

const app = appState.wire(_app);

render(app(), document.body);
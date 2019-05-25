const app = () =>
  div('app')
    (header('app__header')
      (div('app__header-inner-a')('header-a'))
      (div('app__header-inner-b')('header-b'))
    )
    (article('app__content')
      (section('app__content-a')('content-a'))
      (section('app__content-b')('content-b'))
    )

render(app(), document.body);
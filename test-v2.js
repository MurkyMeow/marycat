const { mount } = marycat
const { div, header, article, section, input } = marycat.elements

const Article = (title, ...slot) =>
  article()
    (header(title))
    (...slot) // Is this React xd?

const partial =
  div()
    .attr({ look: 'ma', custom: 'attributes' })

const app =
  div('.app')
    (div('.app__content')('Regular div'))
    (partial('.app__content')('Whoa! I can chain a classname!'))
    (div('#caddy')('And theres an id on me btw'))
    (input()
      .type('text')
      .input(e => console.log(e.target.value))
      .input(() => console.log('Thanks!'))
    )
    (Article('Article title'))
    (Article('Theres a slot!')
      (div('Hi hello hi!'))
    )
    (Article('You can click on me!', 'test it')
      .click(() => console.log('So fancy!'))
    )

mount(document.body, app)
const { makeState, get, mount } = marycat
const { div, header, article, section, input } = marycat.elements

const upper = str => str.toUpperCase()
const reverse = str => [...str].reverse().join('')

const text = makeState('')

// This will fire after every update
// and wont affect the original value
text(reverse)(upper)(console.log)

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
    (Article('Article title'))
    (Article('Theres a slot!')
      (div('Hi hello hi!'))
    )
    (Article('You can click on me!', 'test it')
      .click(() => console.log('So fancy!'))
    )
    (get`Luckily, i can see that text: ${text}`)
    (input()
      .type('password')
      .bind(text) // Is this Vue xddd?
    )
    (get`${text(reverse)}`)

mount(document.body, app)
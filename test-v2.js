const { makeState, get, mount } = marycat
const { div, header, article, section, input } = marycat.elements

const upper = str => str.toUpperCase()
const reverse = str => [...str].reverse().join('')

const text = makeState('')

const show = makeState(true)
const show2 = makeState(true)

setInterval(() => show.value = !show.value, 500)

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
    (div('This works like OR').when(show, show2))
    (div('And this is about AND').when(show).when(show2))

mount(document.body, app)
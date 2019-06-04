const { makeState, get, mount } = marycat
const { div, header, article, section, input, h3, form, button } = marycat.elements

const upper = str => str.toUpperCase()
const reverse = str => [...str].reverse().join('')

const text = makeState('')

const show = makeState(true)
const show2 = makeState(true)

setInterval(() => show.value = !show.value, 1000)

// This will fire after every update
// and wont affect the original value
text.after(reverse).after(upper)(console.log)

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
    (get`${text.after(reverse)}`)
    (h3('George Boole\'s hall of fame'))
    (div('This works like OR').when(show, show2))
    (div('And this is about AND').when(show).when(show2))
    (div('An example of inversion').when(show.after(x => !x)))
    (h3('Form struggles'))
    (form()
      (button('I will reload the page =('))
    )
    (form().submit.prevent(() => console.log('submitted!'))
      (button('`prevent` modifier to the rescue!'))
    )

mount(document.body, app)
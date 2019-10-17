import { State } from '../src/index'
import { div, h3 } from './bindings'

const a = new State(true)
const b = new State(true)

setInterval(() => a.v = !a.v, 1000)

const app =
  div()
    (h3('George Boole\'s hall of fame'))
    (a.and(
      div('A')
    ).or(
      div('not A')
    ))
    (a.or(b).and(
      div('A or B')
    ))
    (a.and(b).and(
      div('A and B')
    ))
app.mount(document.body)

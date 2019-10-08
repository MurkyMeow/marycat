import { div, MaryElement } from './core'
import { webc, Attr } from './webc'
import { State } from './state'

function _app(h: MaryElement,
  name: State<string> = Attr('name', String),
  age: State<number> = Attr('age', Number),
) {
  return h._(div().text`Hello, ${name} ${age.map(String)}`)
}
const app = webc('mary-sample', ['name', 'age'], _app)

app()
  .attr('name', 'qwewq')
  .attr('age', 132555)
  .mount(document.body)

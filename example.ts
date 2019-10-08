import { div } from './core'
import { webc, Attr } from './webc'
import { State } from './state'

const app = webc('mary-sample', {
  observed: ['name', 'age'],
  render(h,
    name: State<string> = Attr('name', String),
    age: State<number> = Attr('age', Number),
  ) {
    return h._(div().text`Hello, ${name} ${age.map(String)}`)
  },
})

app()
  .attr('name', 'qwewq')
  .attr('age', 132555)
  .mount(document.body)

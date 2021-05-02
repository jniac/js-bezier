import { bezier } from '../core/bezier.js'
import { lerp } from '../core/math-utils.js'
import { shortFixed } from '../core/string-utils.js'
import { circle, create, pointer, text, polyline } from '../core/svg-stage.js'

const SAMPLES = 40

const parent = create('g', { x:400, y:100 })

text('flat', { parent })

const anchor = (x, y) => circle({ x, y, r:4, parent }).setOnDrag(node => {
  node.x += pointer.delta.x
  node.y += pointer.delta.y
  draw()
})

const A = anchor(0, 100)
const B = anchor(50, 100)
const C = anchor(50, 0)
const D = anchor(100, 0)

const points = (n = SAMPLES) => {
  const array = new Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    array[i] = {
      x: bezier.cubic(A.x, B.x, C.x, D.x, t),
      y: bezier.cubic(A.y, B.y, C.y, D.y, t),
    }
  }
  return array
}

const flatPoints = () => points()
  .map(({ y }, index, array) => {
    const t = index / (array.length - 1)
    const x = lerp(A.x, D.x, t)
    return { x, y }
  })

const segments = polyline({
  parent,
  stroke: '#f003',
})

const line = polyline({
  parent,
  stroke: 'red',
})  

const flatLine = polyline({
  parent,
  stroke: 'red',
})

const draw = () => {

  const pointsAttribute = points => points
    .map(({ x, y }) => `${shortFixed(x)},${shortFixed(y)}`)
    .join(' ')

  segments.setAttribute('points', pointsAttribute([A, B, C, D]))
  line.setAttribute('points', pointsAttribute(points()))
  flatLine.setAttribute('points', pointsAttribute(flatPoints()))
}

draw()
import { newBench } from './core/bench.js'
import { circle, create, pointer } from './core/svg-stage.js'
import { clamp } from './core/math-utils.js'
import { shortFixed } from './core/string-utils.js'

import('./test/flat.js')
import('./test/clamped.js')
import('./test/perf.js')

const bezierCubic_casteljeau = (x1, y1, x2, y2, x3, y3, x4, y4, t) => {
  const t1 = 1 - t

  const d1x = x1 * t1 + x2 * t
  const d1y = y1 * t1 + y2 * t
  const d2x = x2 * t1 + x3 * t
  const d2y = y2 * t1 + y3 * t
  const d3x = x3 * t1 + x4 * t
  const d3y = y3 * t1 + y4 * t

  const dd1x = d1x * t1 + d2x * t
  const dd1y = d1y * t1 + d2y * t
  const dd2x = d2x * t1 + d3x * t
  const dd2y = d2y * t1 + d3y * t

  const x = dd1x * t1 + dd2x * t
  const y = dd1y * t1 + dd2y * t

  return { x, y }
}

const bezierCubic2 = (x1, y1, x2, y2, x3, y3, x4, y4, t) => {
  const ti = 1 - t

  const x = ti * ti * ti * x1
    + 3 * ti * ti  * t * x2
    + 3 * ti * t * t * x3
    + t * t * t * x4

  const y = ti * ti * ti * y1
    + 3 * ti * ti  * t * y2
    + 3 * ti * t * t * y3
    + t * t * t * y4

  return { x, y }
}

const bezierCubic1D = (x1, x2, x3, x4, t) => {
  const ti = 1 - t
  return (
    ti * ti * ti * x1
    + 3 * ti * ti  * t * x2
    + 3 * ti * t * t * x3
    + t * t * t * x4
  )
}

const bezierCubic1D_optim = (x1, x2, x3, x4, t) => {
  const ti = 1 - t
  const ti2 = ti * ti
  const ti3 = ti2 * ti
  const t2 = t * t
  const t3 = t2 * t

  return (
    ti3 * x1
    + 3 * ti2  * t * x2
    + 3 * ti * t2 * x3
    + t3 * x4
  )
}

const bezierCubic3 = (x1, y1, x2, y2, x3, y3, x4, y4, t) => {
  const ti = 1 - t
  const ti2 = ti * ti
  const ti3 = ti2 * ti
  const t2 = t * t
  const t3 = t2 * t

  const x = ti3 * x1
    + 3 * ti2  * t * x2
    + 3 * ti * t2 * x3
    + t3 * x4

  const y = ti3 * y1
    + 3 * ti2  * t * y2
    + 3 * ti * t2 * y3
    + t3 * y4

  return { x, y }
}

const [x1, y1, x2, y2, x3, y3, x4, y4] = new Array(8).fill(0).map(() => 1000 * Math.random())
const bench = newBench('lol')
bench.add(bezierCubic_casteljeau, (i, n) => {
  const t = i / n
  return bezierCubic_casteljeau(x1, y1, x2, y2, x3, y3, x4, y4, t)
})
bench.add(bezierCubic2, (i, n) => {
  const t = i / n
  return bezierCubic2(x1, y1, x2, y2, x3, y3, x4, y4, t)
})
bench.add(bezierCubic3, (i, n) => {
  const t = i / n
  return bezierCubic3(x1, y1, x2, y2, x3, y3, x4, y4, t)
})
bench.add(bezierCubic1D, (i, n) => {
  const t = i / n
  return {
    x: bezierCubic1D(x1, x2, x3, x4, t),
    y: bezierCubic1D(y1, y2, y3, y4, t),
  }
})
bench.add(bezierCubic1D_optim, (i, n) => {
  const t = i / n
  return {
    x: bezierCubic1D_optim(x1, x2, x3, x4, t),
    y: bezierCubic1D_optim(y1, y2, y3, y4, t),
  }
})
// console.log(bench.test())
// bench.run().then(bench.run)

const bezierCubic01 = (bx, by, cx, cy, t) => {
  const t1 = 1 - t

  const d1x = bx * t
  const d1y = by * t
  const d2x = bx * t1 + cx * t
  const d2y = by * t1 + cy * t
  const d3x = cx * t1 + t
  const d3y = cy * t1 + t

  const dd1x = d1x * t1 + d2x * t
  const dd1y = d1y * t1 + d2y * t
  const dd2x = d2x * t1 + d3x * t
  const dd2y = d2y * t1 + d3y * t

  const x = dd1x * t1 + dd2x * t
  const y = dd1y * t1 + dd2y * t

  return { x, y }
}

const getBezierCubicPoints = (A, B, C, D, n = 10) => {
  const array = new Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    array[i] = bezierCubic2(A.x, A.y, B.x, B.y, C.x, C.y, D.x, D.y, t)
  }
  return array
}

const getBezierCubic01Points = (A, B, n = 10) => {
  const array = new Array(n)
  array[0] = { x:0, y:0 }
  array[n - 1] = { x:1, y:1 }
  for (let i = 1; i < n - 1; i++) {
    const t = i / (n - 1)
    array[i] = bezierCubic_casteljeau(A.x, A.y, B.x, B.y, t)
  }
  return array
}

const minX = 100
const maxX = 200

const anchor = (x, y) => circle({ x, y, r:4 }).setOnDrag(node => {
  node.x = clamp(node.x + pointer.delta.x, minX, maxX)
  node.y = node.y + pointer.delta.y
  window.dispatchEvent(new Event('redraw-bezier'))
})

const A = anchor(minX, 200)
const B = anchor(150, 200)
const C = anchor(150, 100)
const D = anchor(maxX, 100)
const getLinePoints = () => getBezierCubicPoints(A, B, C, D, 100)
  .map(({ x, y }) => `${shortFixed(x)},${shortFixed(y)}`)
  .join(' ')
// const getLinePoints01 = () => getBezierCubicPoints()

const line = create('polyline', {
  fill: 'none',
  stroke: 'red',
  points: getLinePoints(),
})

window.addEventListener('redraw-bezier', () => {
  line.setAttribute('points', getLinePoints())
})

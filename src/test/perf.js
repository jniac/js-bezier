import greBezier from '../lib/bezier-easing.js'
import { bezier } from '../core/bezier.js'
import { newBench } from '../core/bench.js'
import { BEZIERS } from '../preset.js'

const myBezier = (x1, y1, x2, y2) => {
  return x => bezier.solveCubicEasing(x1, y1, x2, y2, x)
}

const randomParams = () => new Array(4).fill().map(() => Math.random())
const curves = [...BEZIERS, ...new Array(8).fill().map(() => randomParams())]

const gre = curves.map(params => greBezier(...params))
const me = curves.map(params => myBezier(...params))

console.log(gre[0](.4))
console.log(me[0](.4))
console.log(gre[0](.4) / me[0](.4))

const easing = bezier.cachedCubicEasing(...curves[0])

const testGre = (i, n) => {
  let x = 0
  for (const fn of gre) {
    x += fn(i / (n - 1))
  }
}

const testMe = (i, n) => {
  let x = 0
  for (const fn of me) {
    x += fn(i / (n - 1))
  }
}

const bench = newBench('solving')
bench.clear()
bench.add(testGre, testGre)
bench.add(testMe, testMe)
bench.run()
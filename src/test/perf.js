import greBezier from '../lib/bezier-easing.js'
import { bezier } from '../core/bezier.js'
import { newBench, thousands } from '../core/bench.js'
import { BEZIERS } from '../preset.js'

const myBezier = (x1, y1, x2, y2) => {
  return x => bezier.solveCubicEasing(x1, y1, x2, y2, x)
}

const randomParams = () => new Array(4).fill().map(() => Math.random())
const curvesParams = [...BEZIERS, ...new Array(8).fill().map(() => randomParams())]

const gre = curvesParams.map(params => greBezier(...params))
const bez = curvesParams.map(params => myBezier(...params))

const testGre = (i, n) => {
  let x = 0
  for (const fn of gre) {
    x += fn(i / (n - 1))
  }
  return x
}

const testBez = (i, n) => {
  let x = 0
  for (const fn of bez) {
    x += fn(i / (n - 1))
  }
  return x
}

const valueComparison = () => {

  const t = performance.now()
  let greTotal = 0
  let bezTotal = 0
  const loop = 1e5
  for (let i = 0; i < loop; i++) {
    greTotal += testGre(i, loop)
    bezTotal += testBez(i, loop)
  }
  const diff =  greTotal / bezTotal
  const dt = performance.now() - t
  
  const lines = []
  lines.push(`value comparison on ${thousands(curvesParams.length * loop)} iterations (${dt.toFixed(3)}ms)`)
  lines.push(`gre: ${greTotal}, jniac: ${bezTotal}`)
  lines.push(`diff: +/-${Math.abs((1 - diff) * 100).toFixed(6)}%`)

  return lines.join('\n')
}

export const randomSpeedTest = (iteration = 20, count = 1e4) => {
  const { solveCubicEasing } = bezier
  const t = performance.now()
  for(let i = 0; i < iteration; i++) {
    const x1 = Math.random()
    const y1 = Math.random()
    const x2 = Math.random()
    const y2 = Math.random()
    for (let j = 0; j < count; j++) {
      solveCubicEasing(x1, y1, x2, y2, j / (count - 1))
    }
  }
  const dt = performance.now() - t
  const opByMs = (iteration * count) / dt
  return `jniac/bezier random speed test: ${opByMs.toFixed(2)}op/ms`
}

export const test = async () => {

  const bench = newBench('cubic easing solving', `(op = ${curvesParams.length} x cubic-solving)`)
  bench.clear()
  bench.add('gre/bezier-easing (with small cache "11 sampleValues")', testGre)
  bench.add('jniac/js-bezier (no cache)', testBez)
  const benchResult = await bench.run()

  return `${benchResult}\n${valueComparison()}\n\n${randomSpeedTest()}`
}

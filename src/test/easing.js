import { bezier } from '../core/bezier.js'
import { clamp } from '../core/math-utils.js'
import { shortFixed } from '../core/string-utils.js'
import { circle, create, grid, line, pointer, polyline, rect, text } from '../core/svg-stage.js'
import { BEZIERS } from '../preset.js'
import greBezier from '../lib/bezier-easing.js'
import { anchor, createGraphWrapper } from './utils.js'

const width = 600
const height = 600

const SAMPLES = width
const STEPS = 9
const DERIVATIVE_SCALE_Y = .2



const {
  graph: parent,
  toGraph,
  fromGraph,
  createCurve,
} = createGraphWrapper(width, height)



text('cubic-easing', { parent, textAnchor:'start', y:-10 })
const g = grid({ parent, width, height, subdivisions:10, color:'#aaa'})
g.xMarker(1/3, '1/3')
g.xMarker(2/3, '2/3')
g.yMarker(1/3, '1/3')
g.yMarker(2/3, '2/3')
line({ parent, x1:0, y1:height, x2:width, y2:0, stroke:'#aaa' })

for (let i = 0; i < 3; i++) {
  const y = DERIVATIVE_SCALE_Y * (i + 1)
  g.yMarker(y, (i + 1), '#fc0')
}

const uniformDots = new Array(STEPS).fill().map(() => circle({ parent, fill:'#aaa', r:4.5 }))
const derivative = create('polygon', { parent, fill:'#fc04' })
const derivativeSecond = create('polygon', { parent, fill:'#f9f4' })
const segments = polyline({ parent, stroke:'#c9f' })
const xCurve = createCurve({ color:'#f42', label:'x' })
const xDerivative = createCurve({ color:'#f42', label:`x'`, SCALE_Y:DERIVATIVE_SCALE_Y })
const yCurve = createCurve({ color:'#2c4', label:'y' })
const yDerivative = createCurve({ color:'#2c4', label:`y'`, SCALE_Y:DERIVATIVE_SCALE_Y })
const exactCurve = polyline({ parent, stroke:'#03f3', 'stroke-width':20 })
const greCurve = polyline({ parent, stroke:'green', 'stroke-width':1 })
const approxCurve = polyline({ parent, stroke:'blue' })
const nonUniformDots = new Array(31).fill().map(() => circle({ parent, fill:'blue', r:2 }))

const createAnchor = (x, y) => {
  ({ x, y } = toGraph({ x, y }))
  return anchor({
    parent,
    x, y,
    onDrag: () => draw(),
    clampX: [0, width],
  })
}
// const BEZIER = BEZIERS[0]
// const BEZIER = [0.5, 0.5, 0.5, 1.0]
// const BEZIER = [0.5, 0.0, 0.5, 1.0]
// const BEZIER = [0.0, 1.0, 1.0, 0.0]
// const BEZIER = [1.0, 0.0, 0.0, 1.0]
// const BEZIER = [0.5, 0.1, 0.1, 0.9]
const BEZIER = [0.6, 0.6, 0.1, 0.9]
const A1 = createAnchor(BEZIER[0], BEZIER[1])
const A2 = createAnchor(BEZIER[2], BEZIER[3])



const valuesText = text('...', { parent, textAnchor:'end', x: width - 10, y: height - 10, userSelect:'all' })



const graphPoints = points => points
  .map(p => toGraph(p))
  .map(({ x, y }) => `${shortFixed(x)},${shortFixed(y)}`)
  .join(' ')

const pointsAttribute = (line, points) => {
  line.setAttribute('points', graphPoints(points))
}

/**
 * 
 * @param {(t:number) => ({ x:number, y:number})} cb 
 * @param {number} count 
 * @returns 
 */
const getSamples = (cb = (t => ({ x:t, y:t })), count = SAMPLES) => new Array(count).fill().map((_, index) => {
  const t = index / (count - 1)
  return cb(t)
})

const draw = () => {
  const { x:x1, y:y1 } = fromGraph(A1)
  const { x:x2, y:y2 } = fromGraph(A2)

  valuesText.element.innerHTML = [x1, y1, x2, y2].map(x => x.toFixed(1)).join(', ')
  
  const points = getSamples(t => {
    const x = bezier.cubic01(x1, x2, t)
    const y = bezier.cubic01(y1, y2, t)
    return { x, y }
  })
  pointsAttribute(segments, [{ x:0, y:0 }, { x:x1, y:y1 }, { x:x2, y:y2 }, { x:1, y:1 }])
  pointsAttribute(exactCurve, points)

  xCurve.update(x => ({ x, y:bezier.cubic01(x1, x2, x) }))
  xDerivative.update(x => ({ x, y:bezier.cubic01Derivative(x1, x2, x) }))

  yCurve.update(x => ({ x, y:bezier.cubic01(y1, y2, x) }))
  yDerivative.update(x => ({ x, y:bezier.cubic01Derivative(y1, y2, x) }))
  
  const derivativePoints = getSamples(t => {
    const x = bezier.cubic01(x1, x2, t)
    const dy = bezier.cubic01Derivative(y1, y2, t)
    const dx = bezier.cubic01Derivative(x1, x2, t)
    const y = clamp(dy / dx, -1e3, 1e3) * DERIVATIVE_SCALE_Y
    return { x, y }
  })
  pointsAttribute(derivative, [...derivativePoints, { x:1, y:0 }, { x:0, y:0 }])

  // NOTE: Can't manage to calculate second derivative, WIP...
  // const derivativeSecondPoints = getSamples(t => {
  //   const x = bezier.cubic01(x1, x2, t)
  //   const dx = bezier.cubic01Derivative(x1, x2, t)
  //   const dy = bezier.cubic01Derivative(y1, y2, t)
  //   const ddx = bezier.cubic01DerivativeSecond(x1, x2, t)
  //   const ddy = bezier.cubic01DerivativeSecond(y1, y2, t)
  //   let y = (dx * ddy - dy * ddx) / (dx * dx)
  //   y = clamp(y || 0, -1e3, 1e3) * DERIVATIVE_SCALE_Y
  //   return { x, y }
  // })
  // pointsAttribute(derivativeSecond, [...derivativeSecondPoints, { x:1, y:0 }, { x:0, y:0 }])

  const gre = greBezier(x1, y1, x2, y2)
  pointsAttribute(greCurve, getSamples(x => ({ x, y:gre(x) })))

  const solve = bezier.cachedCubicEasing(x1, y1, x2, y2)
  const approxPoints = getSamples(x => {
    // const y = bezier.solveCubicEasing(x1, y1, x2, y2, x)
    const y = solve(x)
    return { x, y }
  })
  pointsAttribute(approxCurve, approxPoints)

  uniformDots.forEach((dot, index) => {
    const x = (index + 1) / (STEPS + 1)
    const t = bezier.cubic01SearchT(x1, x2, x)
    const y = bezier.cubic01(y1, y2, t)
    Object.assign(dot, toGraph({ x, y }))
  })

  nonUniformDots.forEach((dot, index, { length }) => {
    const t = (index + 1) / (length + 1)
    const x = bezier.cubic01(x1, x2, t)
    const y = bezier.cubic01(y1, y2, t)
    Object.assign(dot, toGraph({ x, y }))
  })
}

draw()
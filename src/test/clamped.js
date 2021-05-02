import { bezier } from '../core/bezier.js'
import { clamp } from '../core/math-utils.js'
import { shortFixed } from '../core/string-utils.js'
import { circle, create, grid, line, pointer, polyline, text } from '../core/svg-stage.js'
import { BEZIERS } from '../preset.js'
import greBezier from '../lib/bezier-easing.js'

const width = 600
const height = 600

const SAMPLES = width
const STEPS = 9
const DERIVATIVE_SCALE_Y = .2

const parent = create('g', { x:400, y:300 })

const toGraphX = x => x * width
const toGraphY = y => (1 - y) * height
const toGraph = ({ x, y }) => ({ x:toGraphX(x), y:toGraphY(y) })
const fromGraph = ({ x, y }) => ({ x:x / width, y:1 - (y / height) })

const xMarker = (x, str = 'lol', color = '#f00') => {
  const gx = toGraphX(x)
  line({ parent, x1:gx, y1:0, x2:gx, y2:height, stroke:color })
  text(str, { parent, x:gx, y:height + 20, textAnchor:'middle', fill:color })
}

text('clamped', { parent, textAnchor:'start', y:-10 })
grid({ parent, width, height, subdivisions:10 })
xMarker(1/3, '1/3', '#0006')
xMarker(2/3, '2/3', '#0006')

for (let i = 0; i < 3; i++) {
  const y = toGraphY(DERIVATIVE_SCALE_Y * (i + 1))
  line({ parent, stroke:'#fc0', y1:y, x2:toGraphX(1), y2:y })
}

const anchor = (x, y) => circle({ parent, x, y, r:8, stroke:'#c9f', fill:'#c9f3' }).setOnDrag(node => {
  node.x = clamp(node.x + pointer.delta.x, 0, width)
  node.y += pointer.delta.y
  draw()
})

const derivative = create('polygon', { parent, fill:'#fc04' })
const derivativeSecond = create('polygon', { parent, fill:'#f004' })
const segments = polyline({ parent, stroke:'#c9f' })
const xCurve = polyline({ parent, stroke:'#f42', 'stroke-dasharray':[2, 3] })
const yCurve = polyline({ parent, stroke:'#2c4', 'stroke-dasharray':[2, 3] })
const exactCurve = polyline({ parent, stroke:'red', 'stroke-width':1 })
const greCurve = polyline({ parent, stroke:'green', 'stroke-width':1 })
// curve.visible = false
const approxCurve = polyline({ parent, stroke:'blue' })
const dots = new Array(STEPS).fill().map(() => circle({ parent, fill:'blue', r:4 }))
const nonUniformDots = new Array(31).fill().map(() => circle({ parent, fill:'blue', r:2 }))

// const A1 = anchor(100, height)
// const A2 = anchor(100, 0)

const createAnchor = (x, y) => {
  const A = toGraph({ x, y })
  return anchor(A.x, A.y)
}
// const BEZIER = BEZIERS[0]
// const BEZIER = [0.5, 0.5, 0.5, 1.0]
// const BEZIER = [0.5, 0.0, 0.5, 1.0]
// const BEZIER = [0.0, 1.0, 1.0, 0.0]
const BEZIER = [1.0, 0.0, 0.0, 1.0]
const A1 = createAnchor(BEZIER[0], BEZIER[1])
const A2 = createAnchor(BEZIER[2], BEZIER[3])



const valuesText = text('...', { parent, textAnchor:'end', x: width - 10, y: height - 10 })



const pointsAttribute = (line, points) => {
  const str = points
    .map(p => toGraph(p))
    .map(({ x, y }) => `${shortFixed(x)},${shortFixed(y)}`)
    .join(' ')
  line.setAttribute('points', str)
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

  pointsAttribute(xCurve, getSamples(t => ({ x:t, y:bezier.cubic01(x1, x2, t)})))
  pointsAttribute(yCurve, getSamples(t => ({ x:t, y:bezier.cubic01(y1, y2, t)})))

  const derivativePoints = getSamples(t => {
    const x = bezier.cubic01(x1, x2, t)
    const dy = bezier.cubic01Derivative(y1, y2, t)
    const dx = bezier.cubic01Derivative(x1, x2, t)
    const y = clamp(dy / dx, -1e3, 1e3) * DERIVATIVE_SCALE_Y
    return { x, y }
  })
  pointsAttribute(derivative, [...derivativePoints, { x:1, y:0 }, { x:0, y:0 }])

  // const derivativeSecondPoints = getSamples(t => {
  //   const x = bezier.cubic01(x1, x2, t)
  //   const dy = bezier.cubic01DerivativeSecond(y1, y2, t)
  //   const dx = bezier.cubic01DerivativeSecond(x1, x2, t)
  //   const y = clamp(-dx * dy, -1e3, 1e3) * DERIVATIVE_SCALE_Y
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

  // dots.forEach((dot, index) => {
  //   const x = (index + 1) / (STEPS + 1)
  //   const t = bezier.cubic01SearchT(x1, x2, x)
  //   const y = bezier.cubic01(y1, y2, t)
  //   Object.assign(dot, toGraph({ x, y }))
  // })

  nonUniformDots.forEach((dot, index, { length }) => {
    const t = (index + 1) / (length + 1)
    const x = bezier.cubic01(x1, x2, t)
    const y = bezier.cubic01(y1, y2, t)
    Object.assign(dot, toGraph({ x, y }))
  })
}

draw()
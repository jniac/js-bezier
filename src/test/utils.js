import { clamp } from '../core/math-utils.js'
import { shortFixed } from '../core/string-utils.js'
import { circle, create, line, pointer, polyline, text } from '../core/svg-stage.js'

export const createGraphWrapper = (width, height, CURVE_SAMPLES = width) => {

  const graph = create('g', { name:'graph' })
  
  const arrange = () => {
    graph.x = (window.innerWidth - width) / 2
    graph.y = (window.innerHeight - height) / 2
    console.log(graph.x)
  }
  window.addEventListener('resize', () => arrange())
  arrange()

  const lineX = line({ parent:graph, stroke:'#aaa6' })
  const lineY = line({ parent:graph, stroke:'#aaa6' })
  
  graph.element.addEventListener('pointermove', (e) => {
    const x = e.x - graph.x
    const y = e.y - graph.y
    lineX.setAttributes({ x1:x, y1:0, x2:x, y2:height })
    lineY.setAttributes({ x1:0, y1:y, x2:width, y2:y })
  })

  const toGraphX = x => x * width
  const toGraphY = y => (1 - y) * height
  const toGraph = ({ x, y }) => ({ x:toGraphX(x), y:toGraphY(y) })
  const fromGraph = ({ x, y }) => ({ x:x / width, y:1 - (y / height) })
  const graphPointsAttribute = points => (points
    .map(p => toGraph(p))
    .map(({ x, y }) => `${shortFixed(x)},${shortFixed(y)}`)
    .join(' ')
  )



  const createCurve = ({
    color = '#f42',
    strokeDasharray = [2, 3],
    label = '',
    labelX = .3,
    SCALE_Y = 1,
    SAMPLES = CURVE_SAMPLES,
  }) => {
    const curve = polyline({ parent:graph, stroke:color, strokeDasharray })
    const labelText = text(label, { parent:graph, fill:color })

    const mapPoint = ({ x, y }) => ({ x, y:y * SCALE_Y })
    const update = (getPoint) => {
      
      const curvePoints = new Array(SAMPLES).fill().map((_, index) => {
        const x = index / (SAMPLES - 1)
        return getPoint(x)
      })
      curve.setAttribute('points', graphPointsAttribute(curvePoints.map(mapPoint)))

      const labelPoint = toGraph(mapPoint(getPoint(labelX)))
      labelPoint.y += -10
      Object.assign(labelText, labelPoint)
    }

    return { curve, label:labelText, update }
  }
  
  return {
    graph,
    toGraphX,
    toGraphY,
    toGraph,
    fromGraph,

    createCurve,
  }
}


export const anchor = ({ 
  parent, 
  x = 0,
  y = 0,
  onDrag = undefined,
  clampX = [-Infinity, Infinity],
  clampY = [-Infinity, Infinity],
  color = '#c9f',
}) => {

  const r = 8
  const fillOpacity = .25
  const c = circle({ parent, x, y, r, stroke:color, fill:color, fillOpacity })
  
  c.setOnDrag(node => {
    node.x = clamp(node.x + pointer.delta.x, ...clampX)
    node.y = clamp(node.y + pointer.delta.y, ...clampY)
    onDrag?.()
  })

  c.element.addEventListener('pointerover', () => {
    c.setAttributes({ strokeWidth: 3, fillOpacity: .5, r: 10 })
  })

  c.element.addEventListener('pointerout', () => {
    c.setAttributes({ strokeWidth: 1, fillOpacity, r })
  })

  return c
}


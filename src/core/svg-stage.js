import { shortFixed } from './string-utils.js'

export const svgNS = 'http://www.w3.org/2000/svg'
export const svg = document.querySelector('svg')

class Point {
	x = 0
	y = 0
	constructor(x = 0, y = 0) {
		this.x = x
		this.y = y
	}
	copy({ x, y }) {
		this.x = x
		this.y = y
	}
}

export const pointer = {
	position: new Point(),
	positionOld: new Point(),
	delta: new Point(),
	hasMoved: false,
}
const pointerNewPosition = new Point()
const updatePointer = () => {
	const { position, positionOld, delta } = pointer
	positionOld.copy(position)
	position.copy(pointerNewPosition)
	delta.x = position.x - positionOld.x
	delta.y = position.y - positionOld.y
	pointer.hasMoved = pointer.delta.x !== 0 || pointer.delta.y !== 0 
}

window.addEventListener('pointermove', event => {
	pointerNewPosition.copy(event)
})

const onUpdateCallbacks = new Set()
const update = () => {

	updatePointer()
	
	for(const cb of onUpdateCallbacks) {
		cb()
	}

	for (const wrapper of svgWrapperInstances) {
		if (wrapper.transformIsDirty) {
			wrapper.updateTransform()
		}	
		wrapper.onUpdate.call(wrapper, wrapper)
	}	
	
	requestAnimationFrame(update)
}

requestAnimationFrame(update)

/**
 * 
 * @param {SVGWrapper} wrapper 
 * @param {object} params 
 * @returns 
 */
const handleTransform = (wrapper, {
	x = 0,
	y = 0,
	rotation = 0,
	scale = 1,
	scaleX = scale,
	scaleY = scale,
	parent = null,
	...rest
} = {}) => {
	wrapper.position.x = x
	wrapper.position.y = y
	wrapper.scale.x = scaleX
	wrapper.scale.y = scaleY
	wrapper.rotation = rotation
	if (parent) {
		parent.element.appendChild(wrapper.element)
	}
	return rest
}

/** @type {SVGWrapper[]} */
const svgWrapperInstances = new Set()
class SVGWrapper {

	enabled = true
	transformIsDirty = false

	/** @type {SVGElement} */
	element = null
	
	constructor(element) {
		this.element = element
		svg.append(this.element)
		svgWrapperInstances.add(this)
	}

	getAttribute(name) {
		this.element.getAttributeNS(null, name)
	}

	setAttribute(name, value) {
		this.element.setAttributeNS(null, name, value)
	}

	get visible() { return !(this.element.getAttributeNS(null, 'visibilty') === 'hidden') }
	set visible(value) {
		if (!value) {
			this.element.setAttributeNS(null, 'visibility', 'hidden')
		} else {
			this.element.removeAttributeNS(null, 'visibility')
		}
	}

	position = new Point(0, 0)
	scale = new Point(1, 1)
	#rotation = 0
	
	get x() { return this.position.x }
	get y() { return this.position.y }
	get scaleX() { return this.scale.x }
	get scaleY() { return this.scale.y }
	get rotation() { return this.#rotation }

	set x(value) {
		this.position.x = Number(value) || 0
		this.transformIsDirty = true
	}
	set y(value) {
		this.position.y = Number(value) || 0
		this.transformIsDirty = true
	}
	set scaleX(value) {
		this.scale.x = Number(value) || 0
		this.transformIsDirty = true
	}
	set scaleY(value) {
		this.scale.y = Number(value) || 0
		this.transformIsDirty = true
	}
	set rotation(value) {
		this.#rotation = Number(value) || 0
		this.transformIsDirty = true
	}

	updateTransform() {
		const { x, y } = this.position
		const { x:sx, y:sy } = this.scale
		this.element.setAttributeNS(null, 'transform', 
			`translate(${shortFixed(x, 3)}, ${shortFixed(y, 3)}) ` + 
			`rotate(${shortFixed(this.#rotation, 2)}) ` + 
			`scale(${shortFixed(sx, 3)} ${shortFixed(sy, 3)})`)
		this.transformIsDirty = false
	}

	onUpdate() {}
	
	#onPointerOver = null
	setOnPointerOver(callback) {
		this.element.removeEventListener('pointerover', this.#onPointerOver)
		if (callback && typeof callback === 'function') {
			this.#onPointerOver = () => callback.call(this, this)
			this.element.addEventListener('pointerover', this.#onPointerOver)
		}
		return this
	}
	get onPointerOver() { return this.#onPointerOver }
	set onPointerOver(value) { return this.setOnPointerOver(value) }
	
	// should be simplified
	#onDrag
	#onDrag_pointerDown
	#onDrag_pointerUp
	setOnDrag(callback) {
		this.element.removeEventListener('pointerdown', this.#onDrag_pointerDown)
		this.#onDrag_pointerUp?.()
		if (callback && typeof callback === 'function') {
			this.#onDrag = callback
			const onUpdate = () => {
				if (pointer.hasMoved) {
					callback.call(this, this)
				}
			}
			this.#onDrag_pointerDown = () => {
				onUpdateCallbacks.add(onUpdate)
				window.addEventListener('pointerup', this.#onDrag_pointerUp)
			}
			this.#onDrag_pointerUp = () => {
				onUpdateCallbacks.delete(onUpdate)
				window.removeEventListener('pointerup', this.#onDrag_pointerUp)
			}
			this.element.addEventListener('pointerdown', this.#onDrag_pointerDown)
		}
		return this
	}
	get onDrag() { return this.#onDrag }
	set onDrag(value) { return this.setOnDrag(value) }
}

/**
 * Handle the events.
 * @param {SVGWrapper} wrapper 
 * @param {object} param
 * @returns 
 */
const handleEvents = (wrapper, {
	onDrag,
	onUpdate,
	...rest
}) => {

	if (onDrag) {
		wrapper.onDrag = onDrag
	}

	if (onUpdate) {
		wrapper.onUpdate = onUpdate
	}

	return rest
}

/**
 * Create an SVGWrapper.
 * @returns {SVGWrapper}
 */
export const create = (type = 'g', params = {}, extraSvgParams = {}) => {

	const element = document.createElementNS(svgNS, type)

	const wrapper = new SVGWrapper(element)
	params = handleEvents(wrapper, params)
	params = handleTransform(wrapper, params)

	Object.assign(params, extraSvgParams)

	for (const [key, value] of Object.entries(params)) {
		element.setAttributeNS(null, key, value)
	}

	return wrapper
}

export const line = ({
	x1 = 0,
	y1 = 0,
	x2 = 1,
	y2 = 1,
	fill = 'none',
	stroke = 'black',
	...params
} = {}) => create('line', params, { x1, y1, x2, y2, fill, stroke })

export const circle = ({
	r = 10,
	...params
} = {}) => create('circle', params, {
	r,
})

const alignment = {
	TL: [0, 0],
	T: [.5, 0],
	TR: [1, 0],
	R: [1, .5],
	BR: [1, 1],
	B: [.5, 1],
	BL: [0, 1],
	L: [0, .5],
}

/**
 * Creates a centered rectangle.
 */
export const rect = ({
	size = 100,
	width = size,
	height = size,
	align = '',
	...params
} = {}) => {

	let [x, y] = alignment[align] ?? [.5, .5]
	x *= -width
	y *= -height
	
	return create('rect', params, { x, y, width, height })
}

/**
 * Creates a centered rectangle.
 */
export const polyline = ({
	fill = 'none',
	...params
} = {}) => create('polyline', params, {
	fill,
})

export const text = (text = '...', {
	textAnchor = 'middle',
	fontSize = '16px',
	userSelect = 'none',
	...params
} = {}) => {
	const wrapper = create('text', {
    'text-anchor': textAnchor,
		'font-size': fontSize,
		...params
	})
	wrapper.element.innerHTML = text
	wrapper.element.style.userSelect = userSelect
	return wrapper
}

export const grid = ({
	color = '#aaa',
	parent = null,
	width = 100,
	height = 100,
	subdivisions = 10,
	...params
} = {}) => {
	const grid = create('g', { parent,  })
	
	rect({
		width, 
		height,
		stroke: color,
		fill: 'none',
		align:'TL',
		parent: grid,
	})

	for (let i = 1; i < subdivisions; i++) {
		const t = i / subdivisions
		create('line', {
			stroke: color,
			x1: t * width,
			y1: 0,
			x2: t * width,
			y2: height,
			opacity: .25,
			'stroke-dasharray': '2 3',
			parent: grid,
		})
		create('line', {
			stroke: color,
			x1: t * width,
			y1: 0,
			x2: t * width,
			y2: height,
			opacity: .25,
			'stroke-dasharray': '2 3',
			parent: grid,
		})
	}

	
	const xMarker = (x, str = '', markerColor = color) => {
		const gx = x * width
		line({ parent:grid, x1:gx, y1:0, x2:gx, y2:height, stroke:markerColor })
		text(str, { parent:grid, x:gx, y:height + 20, textAnchor:'middle', fill:markerColor })
	}
	
	const yMarker = (y, str = '', markerColor = color) => {
		const gy = (1 - y) * width
		line({ parent:grid, x1:0, y1:gy, x2:width, y2:gy, stroke:markerColor })
		text(str, { parent:grid, x:width + 10, y:gy, textAnchor:'start', fill:markerColor, 'alignment-baseline':'middle' })
	}

	Object.assign(grid, { xMarker, yMarker })
	return grid
}

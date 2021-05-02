/**
 * Returns the cubic interpolation.
 * https://en.wikipedia.org/wiki/B%C3%A9zier_curve#Cubic_B%C3%A9zier_curves
 * @param {number} x1 
 * @param {number} x2 
 * @param {number} x3 
 * @param {number} x4 
 * @param {number} t 
 * @returns 
 */
export const cubic = (x1, x2, x3, x4, t) => {
  const ti = 1 - t
  const ti2 = ti * ti
  const t2 = t * t
  return (
    ti2 * ti * x1
    + 3 * ti2  * t * x2
    + 3 * ti * t2 * x3
    + t2 * t * x4
  )
}

/**
 * Returns the cubic derivative.
 * https://en.wikipedia.org/wiki/B%C3%A9zier_curve#Cubic_B%C3%A9zier_curves
 * @param {number} x1 
 * @param {number} x2 
 * @param {number} x3 
 * @param {number} x4 
 * @param {number} t 
 */
export const cubicDerivative = (x1, x2, x3, x4, t) => {
  const ti = 1 - t
  return (
    3 * ti * ti * (x2 - x1) + 6 * ti * t * (x3 - x2) + 3 * t * t * (x4 - x3)
  )
}

/**
 * Returns the cubic second derivative.
 * https://en.wikipedia.org/wiki/B%C3%A9zier_curve#Cubic_B%C3%A9zier_curves
 * @param {number} x1 
 * @param {number} x2 
 * @param {number} x3 
 * @param {number} x4 
 * @param {number} t 
 * @returns 
 */
export const cubicDerivativeSecond = (x1, x2, x3, x4, t) => {
  return (
    6 * (1 - t) * (x3 - 2 * x2 + x1) + 6 * t * (x4 - 2 * x3 + x2)
  )
}

/**
 * Assuming x1 = 0, x4 = 1.
 * @param {number} x2
 * @param {number} x3 
 * @param {number} t 
 */
export const cubic01 = (x2, x3, t) => {
  const ti = 1 - t
  const t2 = t * t
  return (
    + 3 * ti * ti  * t * x2
    + 3 * ti * t2 * x3
    + t2 * t
  )
}

/**
 * Assuming x1 = 0, x4 = 1.
 * @param {number} x2
 * @param {number} x3 
 * @param {number} t 
 */
 export const cubic01Derivative = (x2, x3, t) => {
  const ti = 1 - t
  return (
    3 * ti * ti * (x2) + 6 * ti * t * (x3 - x2) + 3 * t * t * (1 - x3)
  )
}

/**
 * Assuming x1 = 0, x4 = 1.
 * @param {number} x2
 * @param {number} x3 
 * @param {number} t 
 */
 export const cubic01DerivativeSecond = (x2, x3, t) => {
  return (
    6 * (1 - t) * (x3 - 2 * x2) + 6 * t * (1 - 2 * x3 + x2)
  )
}

/**
 * Search "t" for a given "x" on a 0-1 cubic bezier interval. 
 * Implementation via Binary Search.
 * 12 iterations is enough to produce a smooth interpolation 1000px wide. 
 * 
 * Assuming x1 = 0, x4 = 1
 * @param {number} x2 
 * @param {number} x3 
 * @param {number} x 
 * @param {number} iterations 
 * @param {number} precision 
 */
export const cubic01SearchT = (
  x2,
  x3,
  x,
  iterations = 12,
  precision = 0.0001,
  step = 0.5,
  t = 0.5,
) => {
  if (x <= precision) {
    return 0
  }
  if (x >= 1 - precision) {
    return 1
  }
  for (let i = 0; i < iterations; i++) {
    step /= 2
    const xt = cubic01(x2, x3, t)
    const diff = xt - x
    if (Math.abs(diff) <= precision) {
      return t
    }
    if (diff < 0) {
      t += step
    } else {
      t += -step
    }
  }
  return t
}

/**
 * Solve "y"
 * @param {number} x1 
 * @param {number} y1 
 * @param {number} x2 
 * @param {number} y2 
 * @param {number} x 
 * @param {number} iterations
 * @param {number} precision
 * @returns 
 */
export const solveCubicEasing = (x1, y1, x2, y2, x, iterations = 12, precision = 0.0001) => {
  const t = cubic01SearchT(x1, x2, x, iterations, precision)
  const y = cubic01(y1, y2, t)
  return y
}

export const cachedCubicEasing = (x1, y1, x2, y2, size = 20, precision = 0.0001) => {
  const cache = new Array(size + 1)
  for (let i = 0; i <= size; i++) {
    const t = i / size
    cache[i] = cubic01SearchT(x1, x2, t)
  }
  /**
   * Solve the easing.
   * @param {number} x 
   */
  const solve = x => {
    if (x <= precision) {
      return 0
    }
    if (x >= 1 - precision) {
      return 1
    }
    return solveCubicEasing(x1, y1, x2, y2, x, 4)
    const t1 = cache[Math.floor(x * size)]
    const t2 = cache[Math.ceil(x * size)]
    const ti = (t1 + t2) / 2
    const step = (t2 - t1) / 2
    // const t = cubic01SearchT(x1, x2, x, 6, precision, step, ti)
    const t = t1 + (t2 - t1) * ((x * size) % 1)
    const y = cubic01(y1, y2, t)
    return y
  }
  return solve
}

export const bezier = {
  
  cubic,
  cubicDerivative,
  cubicDerivativeSecond,
  
  cubic01,
  cubic01Derivative,
  cubic01DerivativeSecond,

  cubic01SearchT,
  solveCubicEasing,
  cachedCubicEasing,
}

Object.assign(window, { bezier })

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
 * Implementation via Binary Search and final Linear Interpolation.
 * 6 iterations is enough to produce a smooth interpolation 1000px wide. 
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
  iterations = 6,
  precision = 0.0001,
  lowerT = 0,
  upperT = 1,
  lowerX = 0,
  upperX = 1,
) => {
  if (x <= precision) {
    return 0
  }
  if (x >= 1 - precision) {
    return 1
  }

  let diffX = 0, currentX = 0, currentT = 0
  for (let i = 0; i < iterations; i++) {
    currentT = (lowerT + upperT) / 2
    currentX = cubic01(x2, x3, currentT)
    diffX = x - currentX
    if (Math.abs(diffX) <= precision) {
      return currentT
    }
    if (diffX < 0) {
      upperT = currentT
      upperX = currentX
    } else {
      lowerT = currentT
      lowerX = currentX
    }
  }

  // return the final linear interpolation between lower and upper bounds
  return lowerT + (upperT - lowerT) * (x - lowerX) / (upperX - lowerX)
}

// WIP
// export const cubic01SearchTBounds = (
//   x2,
//   x3,
//   x,
//   iterations = 6,
//   precision = 0.0001,
//   lowerT = 0,
//   upperT = 1,
//   lowerX = 0,
//   upperX = 1,
// ) => {
//   if (x <= precision) {
//     return 0
//   }
//   if (x >= 1 - precision) {
//     return 1
//   }

//   let diffX = 0, currentX = 0, currentT = 0
//   for (let i = 0; i < iterations; i++) {
//     currentT = (lowerT + upperT) / 2
//     currentX = cubic01(x2, x3, currentT)
//     diffX = x - currentX
//     if (Math.abs(diffX) <= precision) {
//       return currentT
//     }
//     if (diffX < 0) {
//       upperT = currentT
//       upperX = currentX
//     } else {
//       lowerT = currentT
//       lowerX = currentX
//     }
//   }

//   // return the final linear interpolation between lower and upper bounds
//   return [low]
// }

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
export const solveCubicEasing = (x1, y1, x2, y2, x, iterations = undefined, precision = undefined) => {
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
    // TODO: do some cache here
    // let index = Math.floor((size + 1) * x)

    return solveCubicEasing(x1, y1, x2, y2, x)
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

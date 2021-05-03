
export const cubic_2D_casteljeau = (x1, y1, x2, y2, x3, y3, x4, y4, t) => {
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

export const cubic01_2D_casteljeau = (bx, by, cx, cy, t) => {
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

/**
 * Simple binary search. Inconvenients : 
 * - The resulting curve is "stepped", and lacks a final linear interpolation (which requires to save lower / upper bounds).
 * @param {number} x2 
 * @param {number} x3 
 * @param {number} x 
 * @param {number} iterations 
 * @param {number} precision 
 * @param {number} step 
 * @param {number} t 
 * @returns 
 */
export const cubic01SearchT_V0 = (
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


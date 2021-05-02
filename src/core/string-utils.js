/**
 * As toFixed() but removes useless trailing chars (save space).
 * @param {number} n 
 * @param {number} length 
 * @returns 
 */
export const shortFixed = (n, length = 1) => {
  const str = Number(n).toFixed(length)
  let end = str.length
  while (end > 1) {
    const c = str[end - 1]
    if (c === '0') {
      end--
    } else if (c === '.') {
      end--
      break
    } else {
      break
    }
  }
  return str.substring(0, end)
}

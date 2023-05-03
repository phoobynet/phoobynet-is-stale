/**
 *
 * @param arr
 */
export const last = <T>(arr : T[] | undefined) : T | undefined => {
  if (!arr) {
    return undefined
  }

  if (arr.length === 0) {
    return undefined
  }

  return arr[arr.length - 1]
}

/**
 * returns the first element of an array or undefined if the array is empty or undefined
 * @param arr
 */
export const first = <T>(arr: T[] | undefined): T | undefined => {
  if (!arr) {
    return undefined
  }

  if (arr.length === 0) {
    return undefined
  }

  return arr[0]
}

/**
 * returns a range of numbers from start to end -1
 * @param {number} start
 * @param {number} end
 */
export const range = (start: number, end: number): number[] => {
  const arr = []

  for (let i = start; i < end; i++) {
    arr.push(i)
  }

  return arr
}

export const uniq = <T>(arr: T[]): T[] => {
  const s = new Set(arr)

  return Array.from(s.values())
}

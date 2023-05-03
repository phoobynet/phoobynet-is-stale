import { isAfter, isBefore, isEqual } from 'date-fns'

export const isBetweenInclusive = (
  date: Date,
  start: Date,
  end: Date,
): boolean => {
  if (isEqual(date, start) || isEqual(date, end)) {
    return true
  }
  return isAfter(date, start) && isBefore(date, end)
}

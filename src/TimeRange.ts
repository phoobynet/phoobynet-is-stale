import { parse, isAfter, isBefore, isEqual } from 'date-fns'
import { isBetweenInclusive } from './helpers/dates'

export default class TimeRange {
  private readonly _start: Date
  private readonly _end: Date
  private readonly _timeRange: string[]
  private readonly _dateOfWeekDay: Date

  constructor(dateOfWeekDay: Date, timeRange: string[]) {
    const tl = timeRange.length

    if (tl === 1) {
      timeRange = [timeRange[0], timeRange[0]]
    }

    const [start, end] = timeRange.map(timeStr =>
      parse(timeStr, 'HHmm', dateOfWeekDay),
    )

    this._start = start
    this._end = end
    this._timeRange = timeRange
    this._dateOfWeekDay = dateOfWeekDay
  }

  get start(): Date {
    return new Date(this._start.getTime())
  }

  get end(): Date {
    return new Date(this._end.getTime())
  }

  inRange(dateTime: Date): boolean {
    return isBetweenInclusive(dateTime, this._start, this._end)
  }

  isAfter(other: Date): boolean {
    return isAfter(this._start, other)
  }

  isSame(other: TimeRange): boolean {
    return isEqual(this._start, other.start) && isEqual(this._end, other.end)
  }

  isBefore(other: Date): boolean {
    return isBefore(this._end, other)
  }

  clone(): TimeRange {
    return new TimeRange(new Date(this._dateOfWeekDay.getTime()), [
      ...this._timeRange,
    ])
  }

  static compare(lhs: TimeRange, rhs: TimeRange): number {
    const lhsStart = lhs.start
    const lhsEnd = lhs.end
    const rhsStart = rhs.start
    const rhsEnd = rhs.end

    if (isEqual(lhsStart, rhsStart) && isEqual(lhsEnd, rhsEnd)) {
      return 0
    }

    if (isEqual(lhsStart, rhsStart)) {
      if (isBefore(lhsEnd, rhsEnd)) {
        return -1
      }

      return 1
    }

    if (isBefore(lhsStart, rhsStart)) {
      return -1
    }

    return 1
  }
}

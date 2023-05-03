import TimeRange from './TimeRange'
import { addDays, formatISO, startOfISOWeek, subDays } from 'date-fns'
import { last } from './helpers/arrays'

export default class WeekDay {
  private readonly _relativeTo: Date
  private readonly _isoDayOfWeek: number
  private readonly _startOfWeek: Date
  private readonly _timeRangesPattern: string[][]
  private readonly _timeRanges: TimeRange[]
  private readonly _dateOfWeekDay: Date

  constructor(relativeTo: Date, isoDayOfWeek: number, timeRanges: string[][]) {
    this._relativeTo = relativeTo
    this._isoDayOfWeek = isoDayOfWeek
    this._startOfWeek = startOfISOWeek(relativeTo)
    this._dateOfWeekDay = addDays(this._startOfWeek, isoDayOfWeek - 1)

    this._timeRangesPattern = timeRanges
    this._timeRanges = timeRanges.map(t => new TimeRange(this.dateOfWeekDay, t))

    this._timeRanges.sort(TimeRange.compare)
  }

  get startOfWeek(): Date {
    return new Date(this._startOfWeek.getTime())
  }

  get dateOfWeekDay(): Date {
    return new Date(this._dateOfWeekDay.getTime())
  }

  get timeRanges(): TimeRange[] {
    return this._timeRanges.map(tr => tr.clone())
  }

  clone(): WeekDay {
    return new WeekDay(
      new Date(this._relativeTo.getTime()),
      this._isoDayOfWeek,
      [...this._timeRangesPattern],
    )
  }

  cloneAsPreviousWeek(): WeekDay {
    const d = subDays(this._relativeTo, 7)
    return new WeekDay(d, this._isoDayOfWeek, [...this._timeRangesPattern])
  }

  anyInRange(dateTime: Date): boolean {
    return this._timeRanges.some(range => range.inRange(dateTime))
  }

  lastTimeRange(): TimeRange {
    return this._timeRanges[this._timeRanges.length - 1].clone()
  }

  firstTimeRange(): TimeRange {
    return this._timeRanges[0].clone()
  }

  findTimeRangePriorTo(dateTime: Date): TimeRange | undefined {
    return last(this._timeRanges.filter(t => t.isBefore(dateTime)))
  }

  static compare(lhs: WeekDay, rhs: WeekDay): number {
    const lhsDate = formatISO(lhs.dateOfWeekDay, { representation: 'date' })
    const rhsDate = formatISO(rhs.dateOfWeekDay, { representation: 'date' })

    if (lhsDate === rhsDate) {
      return 0
    }

    if (lhsDate < rhsDate) {
      return -1
    }

    return 0
  }
}

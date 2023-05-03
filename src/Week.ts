import WeekDay from './WeekDay'
import type TimeRange from './TimeRange'
import { first, last, range, uniq } from './helpers/arrays'
import {
  addMinutes,
  addSeconds,
  format,
  isAfter,
  isBefore,
  isEqual,
  isValid,
  parse,
} from 'date-fns'

const timeRegex = /^(0[0-9]|1[0-9]|2[0-3])[0-5][0-9]$/

/**
 * Represents a week pattern that can be used to determine if a given date is considered "stale"
 */
export default class Week {
  private readonly _relativeTo: Date
  private readonly _weekDays: WeekDay[]
  private readonly _realTimeThrottleSec: number | undefined

  constructor(
    relativeTo: Date,
    isoDaysOfWeek: number[],
    timeRanges: string[][],
    realTimeThrottleSec: number | undefined,
  ) {
    isoDaysOfWeek.forEach(isoDayOfWeek => {
      if (isoDayOfWeek < 1 || isoDayOfWeek > 7) {
        throw new Error(
          `isoDaysOfWeek must be between 1 and 7, got ${isoDayOfWeek}`,
        )
      }
    })

    this._relativeTo = new Date(relativeTo.getTime())
    this._weekDays = isoDaysOfWeek.map(
      isoDaysOfWeek => new WeekDay(relativeTo, isoDaysOfWeek, timeRanges),
    )
    this._weekDays.sort(WeekDay.compare)
    this._realTimeThrottleSec = realTimeThrottleSec
  }

  get relativeTo(): Date {
    return new Date(this._relativeTo.getTime())
  }

  firstWeekDay(): WeekDay {
    const firstWeekDay = first(this._weekDays)

    if (firstWeekDay) {
      return firstWeekDay.clone()
    }

    throw new Error('firstWeekDay was unexpectedly undefined')
  }

  lastWeekDay(): WeekDay {
    const lastWeekDay = last(this._weekDays)

    if (lastWeekDay) {
      return lastWeekDay.clone()
    }

    throw new Error('lastWeekDay was unexpectedly undefined')
  }

  getTimeRanges(): TimeRange[] {
    return this._weekDays.flatMap(x => x.timeRanges)
  }

  findTimeRangePriorTo(dateTime: Date): TimeRange | undefined {
    return (
      last(
        this.getTimeRanges().filter((timeRange: TimeRange) =>
          timeRange.isBefore(dateTime),
        ),
      ) ?? undefined
    )
  }

  anyInRange(dateTime: Date): boolean {
    return this._weekDays
      .map(weekDay => weekDay.anyInRange(dateTime))
      .some(inRange => inRange)
  }

  isStale(when: Date): boolean {
    if (isAfter(when, this.relativeTo)) {
      throw new Error('cacheTimestamp param cannot be after relativeTo value')
    }

    let result = false

    // when the relativeTo value is in range, then the cache will be stale
    if (this.anyInRange(this.relativeTo)) {
      // additional throttling value when real-time
      if (this._realTimeThrottleSec) {
        const w = addSeconds(when, this._realTimeThrottleSec)

        if (isEqual(w, this._relativeTo) || isBefore(w, this._relativeTo)) {
          result = true
        }
      } else {
        result = true
      }
    } else {
      // --- WEEKEND OVERLAP ---
      // when the cacheTimestamp is after the last range of the previous week
      // and before the first range of this week
      // and relativeTo is before this first range of this week
      // return false
      const lastWeeksLastWeekDay = this.lastWeekDay().cloneAsPreviousWeek()

      if (
        lastWeeksLastWeekDay.lastTimeRange().isBefore(when) &&
        this.firstWeekDay().firstTimeRange().isAfter(this.relativeTo)
      ) {
        result = false
      } else {
        // get the TimeRange immediately prior to relativeTo
        const timeRangePriorToRelativeTo = this.findTimeRangePriorTo(
          this.relativeTo,
        )

        if (timeRangePriorToRelativeTo) {
          result = !timeRangePriorToRelativeTo.isBefore(when)
        }
      }
    }

    return result
  }

  static get isoMondayToFriday(): number[] {
    return [1, 2, 3, 4, 5]
  }

  static get isoEveryDay(): number[] {
    return [1, 2, 3, 4, 5, 6, 7]
  }

  static createRelativeTo(
    relativeTo: Date,
    isoDaysOfWeek: number[],
    timeRanges: string[][],
    realTimeThrottleSec: number | undefined = undefined,
  ): Week {
    return new Week(relativeTo, isoDaysOfWeek, timeRanges, realTimeThrottleSec)
  }

  static createRelativeToNow(
    isoDaysOfWeek: number[],
    timeRanges: string[][],
    realTimeThrottleSec: number | undefined = undefined,
  ): Week {
    return this.createRelativeTo(
      new Date(),
      isoDaysOfWeek,
      timeRanges,
      realTimeThrottleSec,
    )
  }

  static createRelativeToNowMonToFriFixedTime(fixedTime: string): Week {
    return this.createRelativeToNow(Week.isoMondayToFriday, [[fixedTime]])
  }

  static createIntervalTimeRange(
    startTime: string,
    endTime: string,
    intervalInMinutes: number,
  ): string[][] {
    if (!timeRegex.test(startTime)) {
      throw new Error('startTime pattern invalid.  Examples: 2359, 0159')
    }

    if (!timeRegex.test(endTime)) {
      throw new Error('endTime pattern invalid.  Examples: 2359, 0159')
    }

    const timePattern = 'HHmm'
    const timeRanges = []

    const start = parse(startTime, timePattern, new Date())
    const end = parse(endTime, timePattern, new Date())

    if (!isValid(start) || !isValid(end)) {
      throw new Error('Invalid start or end time')
    }

    let t = new Date(start.getTime())

    while (isEqual(t, end) || isBefore(t, end)) {
      timeRanges.push([format(t, timePattern)])

      t = addMinutes(t, intervalInMinutes)
    }

    return timeRanges
  }

  static parseRelativeTo(weekPattern: string, relativeTo: Date): Week {
    let days: number[] = []
    const timesOfDay: string[][] = []
    let realTimeThrottleSec: number | undefined

    const [d, t, throttle] = weekPattern.split('|')
    const dayParts = d.split(',')

    for (const dayPart of dayParts) {
      if (dayPart.includes('-')) {
        const hoursMinutes: number[] = dayPart
          .split('-')
          .map(v => parseInt(v, 10))

        const [from, to] = hoursMinutes
        days = [...days, ...range(from, to + 1)]
      } else {
        days.push(parseInt(dayPart))
      }
    }

    // eslint-disable-next-line @typescript-eslint/require-array-sort-compare
    days.sort()
    days = uniq(days)

    const timesParts = t.split(',')

    for (const timesPart of timesParts) {
      timesOfDay.push(timesPart.split('-'))
    }

    realTimeThrottleSec = parseInt(throttle)

    if (isNaN(realTimeThrottleSec)) {
      realTimeThrottleSec = undefined
    }

    return Week.createRelativeTo(
      relativeTo,
      days,
      timesOfDay,
      realTimeThrottleSec,
    )
  }

  /**
   *
   * @param {string} weekPattern - Example 1-3,6,7|0400,0500,1430-1945|3 - the last arguments realTimeThrottleSec is optional
   * @return {Week}
   */
  static parseRelativeToNow(weekPattern: string): Week {
    return this.parseRelativeTo(weekPattern, new Date())
  }
}

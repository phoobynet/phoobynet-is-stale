import { Week } from '../src'
import { parseISO } from 'date-fns'

const weekPattern = '1-5|0400-0500,1430-1945,2100|3'

interface TestCase {
  title: string
  cacheDate: string
  now: string
  expected: boolean
}

describe(`For pattern ${weekPattern}`, () => {
  const testCases: TestCase[] = [
    {
      title:
        'Time falls within a time range, but falls with throttle period, slate = false',
      now: '2023-05-03 14:30:00',
      cacheDate: '2023-05-03 14:30:00',
      expected: false,
    },
    {
      title:
        'Time falls within a time range, and is not with throttle period, slate = true',
      now: '2023-05-03 14:31:00',
      cacheDate: '2023-05-03 14:30:00',
      expected: true,
    },
    {
      title: `Last cache Thu, currently is Saturday, stale = true`,
      now: '2023-05-06 04:00:00',
      cacheDate: '2023-05-04 04:00:00',
      expected: true,
    },
    {
      title: `Last cache Saturday morning, currently is Saturday evening, stale = false`,
      cacheDate: '2023-05-06 04:00:00',
      now: '2023-05-06 08:00:00',
      expected: false,
    },
    {
      title: `Last cache Saturday morning, currently is Monday pre start of any range, stale = false`,
      cacheDate: '2023-05-06 04:00:00',
      now: '2023-05-08 03:59:59',
      expected: false,
    },
  ]

  test.each(testCases)('%s', ({ cacheDate, now, expected }) => {
    const week = Week.parseRelativeTo(weekPattern, parseISO(now))
    const actual = week.isStale(parseISO(cacheDate))
    expect(actual).toBe(expected)
  })
})

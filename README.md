# Is Stale?

Determine if a date is considered stale based on a pattern of week days and times.

# Scenario 1

- A web service provides profiles for companies on the NYSE.  
- Profiles are updated daily at 4am every week day.  
- Each profile request cost you 1 token.
- You decide to cache the data for these requests to save some tokens.
- How would you determine if the data you have is stale based on when that data was last updated?

```typescript
import { Week } from '@phoobynet/is-stale'
const weekPattern = '1-5|0400|0'

const {profile, lastUpdated} = someProfileService.get('AAPL')

const week = Week.parseRelativeToNow(weekPattern)

if (week.isStale(lastUpdated)) {
  // refresh profile
}
```

# Scenario 2

- The same webservice provides other data which is updated more frequently
- You can define multiple times after which data would be considered stale

```typescript
import { Week } from '@phoobynet/is-stale'
const weekPattern = '1-5|0400,0800,1200|0'

const {marketCap, lastUpdated} = someMarketCapService.get('AAPL')

const week = Week.parseRelativeToNow(weekPattern)

if (week.isStale(lastUpdated)) {
  // refresh marketCap
}
```

# Scenario 3

- You want real(ish)-time stock quotes.  For example, you don't want to request a quote more than once every 2 seconds
- You can define a time range within the week pattern where data must be real(ish)-time
- You can then throttle by providing a value indicating how long the cache remains valid

```typescript
const weekPattern = '1-5|1430-2100|2'
const { quote, lastUpdated } = someStockQuoteServiceWithUnderlyingCache.get('AAPL')

const week = Week.parseRelativeToNow(weekPattern)

if (week.isStale(lastUpdated)) {
  // refresh quote
}
```

# Example Patterns

- `1-5|0400|0` - Monday to Friday, 4am, no throttle
- `1-3,6-7|0400,1200-1400|0` - Monday to Wednesday, and Saturday to Sunday, with a fixed time of 4am, and a time range of 12pm to 2pm
- `1-7|1430-2100|3` - Every day, between 2.30pm and 9pm, with a throttle period of 3 seconds

# Example

```typescript
import Week from '@phoobynet/is-stale'
import imaginaryCacheOfStuff from 'imaginary-cache-that-is-somewhere'

interface SomeData {
  cacheTimestamp: Date
  data: unknown
}

function main () {
  const {cacheTimestamp, data} = imaginaryCacheOfStuff.get('some-key')

  // the following pattern split with '|' represents
  // Monday to Friday (ISO weeks days 1-7 starting on a Monday)
  // From 4.00am to 5.00am, 2.30pm to 7.45pm and 9.00pm
  // Throttle for 3 seconds
  const weekPattern = '1-5|0400-0500,1430-1945,2100|3'
  
  // If now falls on a Monday to Friday between the times specified,
  // the data is stale, think getting a quote from the stock market when the market is open.
  // However, using a throttle period of, in this case, 3 seconds, if the last cache timestamp is within that period, then the data is NOT stale
  // If now falls after any ranges, e.g. the following Saturday, and the last cache was before 9.00pm on Friday, the data is NOT stale
  
  const week = Week.parseRelativeToNow(weekPattern)
  
  if (week.isStale(cacheTimestamp)) {
    // refresh cache
  }
}
```


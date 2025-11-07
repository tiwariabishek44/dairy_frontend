export interface NepaliDate {
  year: number
  month: number
  day: number
  monthName: string
}

const nepaliMonths = [
  "baishak",
  "jestha",
  "ashar",
  "shrawan",
  "bhadra",
  "ashwin",
  "kartik",
  "mangsir",
  "poush",
  "magh",
  "falgun",
  "chaitra",
]

// Gregorian to Nepali (Bikram Sambat) conversion
export function gregorianToNepali(date: Date): NepaliDate {
  const gregorianDates = [
    [2000, 1, 1, 2056, 9, 17],
    [2001, 1, 1, 2057, 9, 17],
    [2002, 1, 1, 2058, 9, 17],
    [2003, 1, 1, 2059, 9, 16],
    [2004, 1, 1, 2060, 9, 17],
    [2005, 1, 1, 2061, 9, 17],
    [2006, 1, 1, 2062, 9, 17],
    [2007, 1, 1, 2063, 9, 16],
    [2008, 1, 1, 2064, 9, 17],
    [2009, 1, 1, 2065, 9, 17],
    [2010, 1, 1, 2066, 9, 17],
    [2011, 1, 1, 2067, 9, 16],
    [2012, 1, 1, 2068, 9, 17],
    [2013, 1, 1, 2069, 9, 17],
    [2014, 1, 1, 2070, 9, 17],
    [2015, 1, 1, 2071, 9, 16],
    [2016, 1, 1, 2072, 9, 17],
    [2017, 1, 1, 2073, 9, 17],
    [2018, 1, 1, 2074, 9, 17],
    [2019, 1, 1, 2075, 9, 16],
    [2020, 1, 1, 2076, 9, 17],
    [2021, 1, 1, 2077, 9, 17],
    [2022, 1, 1, 2078, 9, 17],
    [2023, 1, 1, 2079, 9, 16],
    [2024, 1, 1, 2080, 9, 17],
    [2025, 1, 1, 2081, 9, 17],
    [2026, 1, 1, 2082, 9, 17],
  ]

  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const d = date.getDate()

  let idx = gregorianDates.findIndex((element) => {
    if (y < element[0]) return true
    if (y === element[0] && m < element[1]) return true
    if (y === element[0] && m === element[1] && d < element[2]) return true
  })

  if (idx < 0) idx = gregorianDates.length - 1

  const offsetDays = Math.floor(
    (new Date(y, m - 1, d).getTime() -
      new Date(gregorianDates[idx][0], gregorianDates[idx][1] - 1, gregorianDates[idx][2]).getTime()) /
      (24 * 60 * 60 * 1000),
  )
  let nepaliYear = gregorianDates[idx][3]
  let nepaliMonth = gregorianDates[idx][4]
  let nepaliDay = gregorianDates[idx][5] + offsetDays

  const daysInNepaliMonths = [31, 31, 32, 31, 31, 30, 30, 29, 30, 29, 30, 30]

  while (nepaliDay > daysInNepaliMonths[nepaliMonth - 1]) {
    nepaliDay -= daysInNepaliMonths[nepaliMonth - 1]
    nepaliMonth++
    if (nepaliMonth > 12) {
      nepaliMonth = 1
      nepaliYear++
    }
  }

  return {
    year: nepaliYear,
    month: nepaliMonth,
    day: nepaliDay,
    monthName: nepaliMonths[nepaliMonth - 1],
  }
}

export function getNepaliDateString(date: Date): string {
  const nepali = gregorianToNepali(date)
  return `${String(nepali.day).padStart(2, "0")}/${nepali.monthName}`
}

export function getNepaliMonthYearString(date: Date): string {
  const nepali = gregorianToNepali(date)
  return `${String(nepali.month).padStart(2, "0")}/${nepali.year}`
}

export function getNepaliPeriod(date: Date): string {
  return date.getDate() <= 15 ? "First Half" : "Second Half"
}

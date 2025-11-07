const nepaliMonths = [
  "Baishakh",
  "Jyeshtha",
  "Ashadh",
  "Shrawan",
  "Bhadra",
  "Ashwin",
  "Kartik",
  "Mangsir",
  "Poush",
  "Magh",
  "Falgun",
  "Chaitra",
]

export const gregorianToNepali = (date: Date) => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  // Correct Gregorian to Nepali (Bikram Sambat) conversion
  // Nepali new year (Baishakh 1) = April 14, 1944 AD = Baishakh 1, 2000 BS
  let nepaliYear = year - 1943
  let nepaliMonth = month + 9
  const nepaliDay = day

  if (nepaliMonth > 12) {
    nepaliMonth -= 12
    nepaliYear += 1
  }

  return {
    year: nepaliYear,
    month: nepaliMonth,
    day: nepaliDay,
  }
}

export const nepaliToGregorian = (nepaliYear: number, nepaliMonth: number, nepaliDay: number): Date => {
  // Convert Nepali to Gregorian
  let gregYear = nepaliYear + 1943
  let gregMonth = nepaliMonth - 9
  const gregDay = nepaliDay

  if (gregMonth <= 0) {
    gregMonth += 12
    gregYear -= 1
  }

  return new Date(gregYear, gregMonth - 1, gregDay)
}

export const formatNepaliDate = (date: Date): string => {
  const nepali = gregorianToNepali(date)
  return `${String(nepali.day).padStart(2, "0")}/${String(nepali.month).padStart(2, "0")}/${nepali.year}`
}

export const formatNepaliDateShort = (date: Date): string => {
  const nepali = gregorianToNepali(date)
  return `${String(nepali.day).padStart(2, "0")}/${nepaliMonths[nepali.month - 1]}`
}

export const formatNepaliMonth = (date: Date): string => {
  const nepali = gregorianToNepali(date)
  return `${String(nepali.month).padStart(2, "0")}/${nepali.year}`
}

export const getNepaliPeriod = (date: Date): string => {
  const day = date.getDate()
  return day <= 15 ? "First Half" : "Second Half"
}

export const getCurrentNepaliDate = () => {
  return gregorianToNepali(new Date())
}

export const getNepaliMonthName = (month: number): string => {
  return nepaliMonths[month - 1] || ""
}

export const getNepaliMonthYearString = (date: Date): string => {
  const nepali = gregorianToNepali(date)
  return `${String(nepali.month).padStart(2, "0")}/${nepali.year}`
}

export const getNepaliDateString = (date: Date): string => {
  const nepali = gregorianToNepali(date)
  return `${String(nepali.day).padStart(2, "0")}/${nepaliMonths[nepali.month - 1]}`
}

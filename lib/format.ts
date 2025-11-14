export const formatAmount = (amount: number): string => {
  // Split the number into integer and decimal parts
  const parts = amount.toFixed(1).split(".")
  const integerPart = parts[0]
  const decimalPart = parts[1]

  // Format the integer part with Indian comma style
  const lastThree = integerPart.slice(-3)
  const otherNumbers = integerPart.slice(0, -3)

  let formattedInteger = ""
  if (otherNumbers === "") {
    formattedInteger = lastThree
  } else {
    formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree
  }

  // Return with decimal part
  return formattedInteger + "." + decimalPart
}

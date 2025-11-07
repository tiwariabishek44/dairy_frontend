export const formatAmount = (amount: number): string => {
  const amountStr = Math.round(amount).toString()
  const lastThree = amountStr.slice(-3)
  const otherNumbers = amountStr.slice(0, -3)

  if (otherNumbers === "") return lastThree

  return otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree
}

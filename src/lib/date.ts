export function yesterday(): Date {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date;
}

export function yesterdayBeforeYesterday(): Date {
  const date = new Date();
  date.setDate(date.getDate() - 2);
  return date;
}

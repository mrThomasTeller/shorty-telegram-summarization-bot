export function todayMidday(): Date {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  return date;
}

export function yesterday(): Date {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date;
}

export function twelveHoursAgo(): Date {
  const date = new Date();
  date.setHours(date.getHours() - 12);
  return date;
}

export function thisWeekStart(): Date {
  const date = new Date();
  date.setDate(date.getDate() - date.getDay() + 1);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

export function hoursAgo(hours: number): Date {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date;
}

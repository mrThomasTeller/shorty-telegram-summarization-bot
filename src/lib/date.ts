import _ from 'lodash';

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

/**
 * Возвращает дату начала текущего месячного периода подписки,
 * которая была оформлена в указанную дату.
 */
export function monthFromPeriodStart(periodStart: Date): Date {
  const period = new Date(periodStart);
  const now = new Date();
  period.setFullYear(now.getFullYear());
  period.setMonth(now.getMonth());
  return period;
}

export function thisMonthStart(): Date {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function thisWeekStart(): Date {
  const dayOfWeek = _.flow(
    () => new Date().getDay(),
    // Sunday is 7
    (day) => (day === 0 ? 7 : day)
  )();

  const date = new Date();
  date.setDate(date.getDate() - dayOfWeek + 1);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function todayMidday(): Date {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  return date;
}

export function twelveHoursAgo(): Date {
  const date = new Date();
  date.setHours(date.getHours() - 12);
  return date;
}

export function yesterday(): Date {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date;
}

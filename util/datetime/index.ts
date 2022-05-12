// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

export type DateCountableUnit = 'years' | 'months' | 'days' | 'weeks' | 'quarters';
export type TimeCountableUnit = 'hours' | 'minutes' | 'seconds' | 'ms';
export type DatetimeCountableUnit = DateCountableUnit | TimeCountableUnit;

export type DateUnit = 'year' | 'month' | 'day' | 'week' | 'quarter' | 'yearDay' | 'weekDay';
export type TimeUnit = 'hours' | 'minutes' | 'seconds' | 'ms';
export type DatetimeUnit = DateUnit | TimeUnit;

export function isValidDate(date: any) {
  return date !== null && date !== undefined && new Date(date).toString() !== 'Invalid Date';
}

export function isLeapYear(year: number) {
  return ((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0);
}

export function daysOfMonth(month: number, year = new Date().getFullYear()) {
  return month >= 8 
    ? !(month % 2) ? 31 : 30
    : month === 2
      ? isLeapYear(year) ? 29 : 28
      : !(month % 2) ? 30 : 31
}

export function getDayOfYear(date: Date) {
  var start = new Date(date.getFullYear(), 0, 0);
  var diff = (+date - +start) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
  var oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}
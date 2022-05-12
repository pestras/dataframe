// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { TimeSeries } from ".";
import { isValidDate } from "../../util/datetime";
import { DFDatetime } from "../datetime/type";
import { NumberSeries } from "../number";
import { DFTimeConstraintError } from "./errors";
import { DFTime } from "./type";

/**
 * filter options interface
 * ------------------------------------------------------------
 */

export interface TimeMatch {
  eq: DFTime | DFTime[] | TimeSeries;
  neq: DFTime | DFTime[] | TimeSeries;
  gt: DFTime | DFTime[] | TimeSeries;
  gte: DFTime | DFTime[] | TimeSeries;
  lt: DFTime | DFTime[] | TimeSeries;
  lte: DFTime | DFTime[] | TimeSeries;
  in: DFTime[] | TimeSeries;
  nin: DFTime[] | TimeSeries;
  inRange: { start: DFTime, end: DFTime };
  ninRange: { start: DFTime, end: DFTime };
  inHours: number[] | NumberSeries;
  ninHours: number[] | NumberSeries;
  inMinutes: number[] | NumberSeries;
  ninMinutes: number[] | NumberSeries;
  inSeconds: number[] | NumberSeries;
  ninSeconds: number[] | NumberSeries;
  getViolations: null;
  or: TimeMatch[];
}



/**
 * Time Reducer
 * ------------------------------------------------------------
 */

export type TimeReducer = 'min' | 'max' | 'mid' | 'qnt';
export type TimeDeltaReducer = 'totalHours' | 'totalMinutes' | 'totalSeconds' | 'totalMs';



/**
 * Date Transformer
 * ---------------------------------------------------------
 */

export type TimeTransformer = 'add' | 'sub' | 'addHours' | 'addMinutes' | 'addSeconds' | 'addMs';




/**
 * Date Caster
 * ---------------------------------------------------------
 */

export type TimeCaster = 'cumsum' | 'delta' | 'format' | 'toBooleans' | 'toTimeUnit' | 'toNumber' | 'toString';



/**
* Date Utility
* ---------------------------------------------------------
*/

export const timeUtil = {
  toTime(date: Date | number | string | DFTime | DFDatetime) {
    return date instanceof DFDatetime || date instanceof DFTime || date instanceof DFTime
      ? new DFTime(date.date)
      : isValidDate(date)
        ? new DFTime(new Date(date))
        : null;
  },

  isTimeReducer(reducer: any): reducer is TimeReducer {
    return ['min', 'max', 'mid', 'qnt'].includes(reducer);
  },

  isTimeDeltaReducer(reducer: any): reducer is TimeDeltaReducer {
    return ['totalHours', 'totalMinutes', 'totalSeconds'].includes(reducer);
  },

  isAnyTimeReducer(reducer: any): reducer is (TimeReducer | TimeDeltaReducer) {
    return this.isTimeReducer(reducer) || this.isTimeDeltaReducer(reducer);
  },

  isTimeTransformer(transformer: any): transformer is TimeCaster {
    return ['add', 'sub', 'addHours', 'addMinutes', 'addSeconds', 'addMs'].includes(transformer);
  },

  isTimeCaster(caster: any): caster is TimeCaster {
    return ['cumsum', 'delta', 'format', 'toBooleans', 'toTimeUnit', 'toNumber', 'toString'].includes(caster);
  },

  count(values: IterableIterator<DFTime>) {
    let count = 0;

    for (const _ of values)
      count++;

    return count;
  },

  nullCount(values: IterableIterator<DFTime>) {
    let count = 0;

    for (const value of values)
      value === null && count++;

    return count;
  },

  min(values: IterableIterator<DFTime>) {
    let min = Infinity;

    for (const value of values)
      if (value instanceof DFTime && min > +value)
        min = +value;

    return min === Infinity ? null : new DFTime(min);
  },

  max(values: IterableIterator<DFTime>) {
    let max = -Infinity;

    for (const value of values)
      if (value instanceof DFTime && max < +value)
        max = +value;

    return max === -Infinity ? null : new DFTime(max);
  },

  mid(values: IterableIterator<DFTime>) {
    const min = this.min(values);
    const max = this.max(values);

    return min === null || max === null ? null : new DFTime((+min.date + +max.date) / 2);
  },

  qnt(values: IterableIterator<DFTime>, position = 0.5) {
    const list = Array.from(values).filter(Boolean).sort((a, b) => a.lt(b) ? -1 : 1);
    const length = list.length;
    const index = length * position;

    return ("" + index).includes(".")
      ? list[Math.ceil(index)]
      : this.mid([list[index], list[index + 1]].values());
  },

  delta(values: IterableIterator<DFTime>) {
    const min = this.min(values);
    const max = this.max(values);

    return min === null || max === null ? null : min.delta(max);
  },

  totalHours(values: IterableIterator<DFTime>) {
    const delta = this.delta(values);

    return !!delta ? delta.count('hours') : 0;
  },

  totalMinutes(values: IterableIterator<DFTime>) {
    const delta = this.delta(values);

    return !!delta ? delta.count('minutes') : 0;
  },

  totalSeconds(values: IterableIterator<DFTime>) {
    const delta = this.delta(values);

    return !!delta ? delta.count('seconds') : 0;
  },

  totalMs(values: IterableIterator<DFTime>) {
    const delta = this.delta(values);

    return !!delta ? delta.count('ms') : 0;
  }
}



/**
 * Time Constraints
 * ---------------------------------------------------------
 */

export const TimeConstraintsList = [
  'notNull', 'min', 'max', 'in', 'nin', 'inYears', 'ninYears', 'inMonth', 'eq', 'neq',
  'ninMonth', 'inDays', 'ninDays', 'inWeekDays', 'ninWeekDays', 'inQuarters', 'ninQuarters',
  'inHours', 'ninHours', 'inMinutes', 'ninMinutes', 'inSeconds', 'ninSeconds'
] as const;

export type TimeConstraint = typeof TimeConstraintsList[number];

export interface TimeConstraints {
  notNull?: any;
  min?: DFTime;
  max?: DFTime;
  eq?: DFTime;
  neq?: DFTime;
  in?: DFTime[];
  nin?: DFTime[];
  inHours?: number[];
  ninHours?: number[];
  inMinutes?: number[];
  ninMinutes?: number[];
  inSeconds?: number[];
  ninSeconds?: number[];
}

export const timeConstraintsUtil = {

  isValidConstraints(constraints: TimeConstraints) {

    for (const key in constraints)
      if (!TimeConstraintsList.includes(key as TimeConstraint))
        return false;

    return true;
  },

  isValid(date: Date | number | string | DFDatetime | DFTime | DFTime, constraints: TimeConstraints) {
    date = timeUtil.toTime(date);

    for (const cName of Object.keys(constraints))
      if (!this[cName as 'notNull'](date, constraints[cName as 'notNull']))
        return false;

    return true;
  },

  notNull(time: any, _: any) {
    return time === null ? false : true;
  },

  min(value: DFTime, min: DFTime) {
    return value !== null && min.gt(new DFTime(value)) ? false : true;
  },

  max(value: DFTime, max: DFTime) {
    return value !== null && max.gt(new DFTime(value)) ? false : true;
  },

  eq(value: DFTime, eq: DFTime) {
    return value !== null && !eq.eq(new DFTime(value)) ? false : true;
  },

  neq(value: DFTime, eq: DFTime) {
    return value !== null && eq.eq(new DFTime(value)) ? false : true;
  },

  in(value: DFTime, list: DFTime[]) {
    if (value === null) return true;

    const time = new DFTime(value);

    return !list.some(d => d.eq(time)) ? false : true;
  },

  nin(value: DFTime, list: DFTime[]) {
    if (value === null) return true;

    const time = new DFTime(value);

    return list.some(d => d.eq(time)) ? false : true;
  },

  inHours(value: DFTime, hours: number[]) {
    if (value === null) return true;

    const time = new DFTime(value);

    return !hours.includes(time.hours) ? false : true;
  },

  ninHours(value: DFTime, hours: number[]) {
    if (value === null) return true;

    const time = new DFTime(value);

    return hours.includes(time.hours) ? false : true;
  },

  inMinutes(value: DFTime, minutes: number[]) {
    if (value === null) return true;

    const time = new DFTime(value);

    return !minutes.includes(time.minutes) ? false : true;
  },

  ninMinutes(value: DFTime, minutes: number[]) {
    if (value === null) return true;

    const time = new DFTime(value);

    return minutes.includes(time.minutes) ? false : true;
  },

  inSeconds(value: DFTime, seconds: number[]) {
    if (value === null) return true;

    const time = new DFTime(value);

    return !seconds.includes(time.seconds) ? false : true;
  },

  ninSeconds(value: DFTime, seconds: number[]) {
    if (value === null) return true;

    const time = new DFTime(value);

    return seconds.includes(time.seconds) ? false : true;
  }
}
// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { ID } from "../util";
import { NumberConstraintError } from "./errors";

/**
 * Number Reducer Type
 * ====================================================================================================================
 */
export type NumbersReducer = 'count' | 'min' | 'max' | 'mid' | 'sum' | 'mean' | 'variance' | 'std' | 'mode' | 'rear';

/**
 * Number Transformer Type
 * ====================================================================================================================
 */
export type NumberTronsformer = 'round' | 'ceil' | 'floor' | 'abs' |
  'sign' | 'cumsum' | 'percOfTotal' | 'percOfRange' | 'add' | 'sub' |
  'times' | 'divideBy' | 'mod' | 'power' | 'root' | 'calculate';

/**
 * Number Caster Type
 * ====================================================================================================================
 */
export type NumberCaster = 'toBooleans' | 'toDates' | 'ToNumbers' | 'toStrings';

/**
 * filter options interface
 * ====================================================================================================================
 */
export interface NumbersFilter {
  get: ID;
  getMany: ID[];
  getManyInv: ID[];
  nulls: any;
  notNulls: any;
  equals: number | NumbersReducer;
  notEquals: number | NumbersReducer;
  in: number[];
  nin: number[];
  gt: number | NumbersReducer;
  gte: number | NumbersReducer;
  lt: number | NumbersReducer;
  lte: number | NumbersReducer;
  inRange: [number | NumbersReducer, number | NumbersReducer];
  ninRange: [number | NumbersReducer, number | NumbersReducer];
  getViolations: null;
  or: NumbersFilter[];
}



/**
 * Number Utility Methods
 * ====================================================================================================================
 */
export const numbersUtil = {
  isNumberReducer(reducer: any): reducer is NumbersReducer {
    return ['min', 'max', 'mid', 'sum', 'mean', 'variance', 'std', 'mode', 'rear'].includes(reducer);
  },

  isNumberTransformer(transformer: any): transformer is NumberTronsformer {
    return [
      'round', 'ceil', 'floor', 'abs', 'sign', 'cumsum', 'percOfTotal', 'percOfRange',
      'add', 'sub', 'times', 'divideBy', 'mod', 'power', 'root', 'calculate'
    ].includes(transformer);
  },

  isNumberCaster(caster: any): caster is NumberCaster {
    return ['toBooleans', 'toDates', 'ToNumbers', 'toStrings'].includes(caster);
  },

  count(values: IterableIterator<number>) {
    let count = 0;

    for (const _ of values)
      count++;

    return count;
  },

  min(values: IterableIterator<number>) {
    let min = Infinity;

    for (const value of values)
      if (typeof value === 'number' && min > value)
        min = value;

    return min === Infinity ? 0 : min;
  },

  max(values: IterableIterator<number>) {
    let max = -Infinity;

    for (const value of values)
      if (typeof value === 'number' && max < value)
        max = value;

    return max === -Infinity ? 0 : max;
  },

  mid(values: IterableIterator<number>) {
    return (this.min(values) + this.max(values)) / 2;
  },

  sum(values: IterableIterator<number>) {
    let sum = 0;

    for (const value of values)
      if (typeof value === 'number')
        sum += value;

    return sum;
  },

  mean(values: IterableIterator<number>) {
    const count = this.count(values);

    if (count === 0)
      return 0;

    return this.sum(values) / count;
  },

  variance(values: IterableIterator<number>) {
    const count = this.count(values);
    let variance = 0;


    if (count <= 1)
      return variance;

    const mean = this.mean(values);

    for (const value of values)
      if (typeof value === 'number')
        variance += Math.pow(value - mean, 2) / count - 1;

    return variance;
  },

  std(values: IterableIterator<number>) {
    return Math.sqrt(this.variance(values));
  },

  quantile(values: IterableIterator<number>, pos: number) {
    const count = this.count(values);

    if (pos > 1 || pos < 0 || count === 0)
      return 0;

    const sorted = Array.from(values).sort((a, b) => a - b);
    const index = count * pos;
    const floor = Math.floor(index);

    return floor !== index ? sorted[floor] + sorted[floor + 1] / 2 : sorted[floor];
  },

  mode(values: IterableIterator<number>) {
    const map: { [key: number]: number } = {};
    let top: [value: number, count: number] = [null, 0];

    for (const val of values)
      if (map[val] === undefined)
        map[val] = 1;
      else
        map[val] += 1;

    for (const value in map)
      if (map[value] > top[1])
        top = [+value as number, map[value]];

    return top[0];
  },

  rear(values: IterableIterator<number>) {
    const map: { [key: number]: number } = {};
    let least: [value: number, count: number] = [null, 0];

    for (const val of values)
      if (map[val] === undefined)
        map[val] = 1;
      else
        map[val] += 1;

    for (const value in map)
      if (map[value] < least[1])
        least = [+value as number, map[value]];

    return least[0];
  }
}



/**
 * Number Constraints
 * ====================================================================================================================
 */
export interface NumberConstraints {
  notNull?: boolean;
  equals?: number;
  nEquals?: number;
  min?: number;
  max?: number;
}

export const numberConstraints = {

  isValidConstraints(constraints: NumberConstraints) {
    const props = ["notNull", "equals", "nEquals", "min", "max"];

    for (const key of Object.keys(constraints || {}))
      if (!props.includes(key))
        return false;

    return true;
  },

  check(num: number, constraints: NumberConstraints, throwError = true) {
    for (const cName of Object.keys(constraints)) {
      try {
        this[cName as 'notNull'](num, constraints[cName as 'notNull']);

      } catch (error: any) {
        if (throwError) throw error;
        return false;
      }
    }

    return true;
  },

  notNull(num: number, value: boolean) {
    if (value && typeof num !== 'number')
      throw new NumberConstraintError("null values are not allowed");
  },

  equals(num: number, value: number) {
    if (value && num !== value)
      throw new NumberConstraintError(`value must equals '${value}' got: '${num}'`);
  },

  nEquals(num: number, value: number) {
    if (value && num === value)
      throw new NumberConstraintError(`value must not equals '${value}'`);
  },

  min(num: number, value: number) {
    if (value && num < value)
      throw new NumberConstraintError(`value must be greater than or equals to '${value}' got: '${num}'`);
  },

  max(num: number, value: number) {
    if (value && num > value)
      throw new NumberConstraintError(`value must be less than or equals to '${value}' got: '${num}'`);
  }
}
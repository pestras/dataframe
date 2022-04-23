// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { ID } from "../util";
import { StringConstraintError } from "./errors";



/**
 * filter options interface
 * ====================================================================================================================
 */
export interface StringsFilter {
  get: ID;
  getMany: ID[];
  getManyInv: ID[];
  nulls: null;
  notNulls: null;
  equals: string;
  nEquals: string;
  in: string[];
  nin: string[];
  equalsLen: number | StrToNumReducer;
  nEqualsLen: number | StrToNumReducer;
  gtLen: number | StrToNumReducer;
  gteLen: number | StrToNumReducer;
  ltLen: number | StrToNumReducer;
  lteLen: number | StrToNumReducer;
  reges: RegExp;
  getViolations: null;
  or: StringsFilter[];
}



// Strings reducer types
// ====================================================================================================================
export type StrReducer = 'mode' | 'rear';



// Strings reducer types
// ====================================================================================================================
export type StrToNumReducer = 'count' | 'sumLen' | 'minLen' | 'maxLen' | 'avgLen';



/**
 * String Transform types
 * ====================================================================================================================
 */
export type StringTransformer = 'lowercase' | 'uppercase' | 'slice' | 'replace' | 'template';



/**
 * String Cast types
 * ====================================================================================================================
 */
export type StringCster = 'toBooleans' | 'toDates' | 'toNumbers' | 'toStrings' | 'len';



/**
 * Strings Utility methods
 * ====================================================================================================================
 */
export const stringsUtil = {
  isStrReducer(reducer: any): reducer is StrReducer {
    return ['mode', 'rear'].includes(reducer);
  },

  isStrToNumReducer(reducer: any): reducer is StrToNumReducer {
    return ['count', 'sumLen', 'minLen', 'maxLen', 'angLen'].includes(reducer);
  },

  isStringTransformer(transforme: any): transforme is StrToNumReducer {
    return ['lowercase', 'uppercase', 'slice', 'replace', 'template'].includes(transforme);
  },

  isStringCaster(caster: any): caster is StringCster {
    return [].includes(caster);
  },

  count(values: IterableIterator<string>) {
    let count = 0;

    for (const _ of values)
      count++;

    return count;
  },

  mode(values: IterableIterator<string>) {
    const map: { [key: string]: number } = {};
    let top: [value: string, count: number] = [null, 0];

    for (const val of values)
      if (map[val] === undefined)
        map[val] = 1;
      else
        map[val] += 1;

    for (const value in map)
      if (map[value] > top[1])
        top = [value, map[value]];

    return top[0];
  },

  rear(values: IterableIterator<string>) {
    const map: { [key: string]: number } = {};
    let least: [value: string, count: number] = [null, 0];

    for (const val of values)
      if (map[val] === undefined)
        map[val] = 1;
      else
        map[val] += 1;

    for (const value in map)
      if (map[value] < least[1])
        least = [value, map[value]];

    return least[0];
  },

  sumLen(values: IterableIterator<string>) {
    let sum = 0;

    for (const value of values)
      sum += value === null ? 0 : value.length;

    return sum;
  },

  minLen(values: IterableIterator<string>) {
    let min = Infinity;

    for (const value of values)
      if (value !== null && value.length < min)
        min = value.length;

    return min === Infinity ? 0 : min;
  },

  maxLen(values: IterableIterator<string>) {
    let max = -Infinity;

    for (const value of values)
      if (value !== null && value.length > max)
        max = value.length;

    return max === -Infinity ? 0 : max;
  },

  avgLen(values: IterableIterator<string>) {
    const count = this.count(values);
    return count > 0 ? this.sumLen(values) / count : 0;
  },

  strTemplate(template: string, ...data: { [key: string]: any }[]): string {
    let reg = /\{\{\s*([\w\.]+)\s*\}\}/g;
    let skip = data.length > 1;
  
    for (let i = 0; i < data.length; i++) {
      let source = data[i];
      skip = i < data.length - 1;
  
      template = template.replace(reg, (match: string, $1: string): string => {
        let parts = $1.split("."), temp: any;
        match = match;
    
        if (parts.length == 1) {
          let value = source[parts[0]];
          return value === undefined ? (skip ? `{{${$1}}}` : "") : value;
        }
    
        temp = source[parts[0]];
    
        for (let i = 1; i < parts.length; i++) {
          temp = temp[parts[i]];
        }
    
        return temp === undefined ? (skip ? `{{${$1}}}` : "") : temp;
      });
    }
  
    return template;
  }
}



/**
 * Strings Column Constraint
 * ====================================================================================================================
 */
export interface StringConstraints {
  notNull?: boolean;
  notEmpty?: boolean;
  len?: number;
  minLen?: number;
  maxLen?: number;
  regex?: RegExp;
}

export const stringConstraints = {

  isValidConstraints(constraints: StringConstraints) {
    const props = ["notNull", "notEmpty", "len", "minLen", "maxLen", "regex"];

    for (const key of Object.keys(constraints || {}))
      if (!props.includes(key))
        return false;

    return true;
  },

  check(str: string, constraints: StringConstraints, throwError = true) {
    for (const constName in constraints) {
      try {
        this[constName as 'notNull'](str, constraints[constName as 'notNull']);
      } catch (error: any) {
        if (throwError) throw error;
        else return false;
      }
    }

    return true;
  },

  notNull(str: string, value: boolean) {
    if (value && typeof str !== 'string')
      throw new StringConstraintError("null values are not allowed");
  },

  notEmpty(str: string, value: boolean) {
    if (value && str === "")
      throw new StringConstraintError("enpty strings are not allowed");
  },

  len(str: string, value: number) {
    if (str?.length !== value)
      throw new StringConstraintError(`'${str}' length must equal ${value}`);
  },

  minLen(str: string, value: number) {
    if (str?.length < value)
      throw new StringConstraintError(`'${str}' length must be greater than ${value}`);
  },

  maxLen(str: string, value: number) {
    if (str?.length > value)
      throw new StringConstraintError(`'${str}' length must not exceed ${value}`);
  },

  regex(str: string, value: RegExp) {
    if (!value.test(str))
      throw new StringConstraintError(`'${str}' must match pattern '${value.toString()}'`);
  }
}
// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { ID } from "../util";
import { BooleanConstraintError } from "./errors";

/**
 * filter options interface
 * ====================================================================================================================
 */
export interface BooleansFilter {
  get: ID;
  getMany: ID[]; 
  getManyInv: ID[]; 
  nulls: any;
  notNulls: any;
  trues: any;
  falses: any;
  getViolations: null;
  or: BooleansFilter[];
}



// Boolean reducer types
// ====================================================================================================================
export type BoolToNumberReducer = 'count' | 'trueCount' | 'falseCount' | 'nullCount';
export type BoolToBoolReducer = 'lgcAnd' | 'lgcNand' | 'lgcOr' | 'lgcNor' | 'lgcXor' | 'lgcXnor' | 'mode' | 'rear';
export type BoolReducer = BoolToBoolReducer | BoolToNumberReducer;


// Boolean reducer types
// ====================================================================================================================
export type BoolCaster = 'toBooleans' | 'toDates' | 'toNumbers' | 'toStrings';


/**
 * Boolean Utility methods
 * ====================================================================================================================
 */
export const booleansUtil = {
  isBoolToBoolReducer(reducer: any): reducer is BoolToBoolReducer {
    return ['count', 'lgcAnd', 'lgcNand', 'lgcOr', 'lgcNor', 'lgcXor', 'lgcXnor', 'mode', 'rear'].includes(reducer);
  },

  isBoolToNumberReducer(reducer: any): reducer is BoolToNumberReducer {
    return ['count', 'trueCount', 'falseCount', 'nullCount'].includes(reducer);
  },

  isBoolReducer(reducer: any): reducer is BoolReducer {
    return this.isBoolToBoolReducer(reducer) || this.isBoolToNumberReducer(reducer);
  },

  isBoolCaster(caster: any): caster is BoolCaster {
    return ['toBooleans', 'toDates', 'toNumbers', 'toStrings'].includes(caster);
  },

  count(values: IterableIterator<boolean>) {
    let count = 0;

    for (const _ of values)
      count++;

    return count;
  },

  trueCount(values: IterableIterator<boolean>) {
    let count = 0;

    for (const value of values)
      if (value)
        count++;

    return count;
  },

  falseCount(values: IterableIterator<boolean>) {
    let count = 0;

    for (const value of values)
      if (value === false)
        count++;

    return count;
  },

  nullCount(values: IterableIterator<boolean>) {
    let count = 0;

    for (const value of values)
      if (value === null)
        count++;

    return count;
  },

  lgcAnd(values: IterableIterator<boolean>) {
    for (const value of values)
      if (!value)
        return false;

    return true;
  },

  lgcNand(values: IterableIterator<boolean>) {
    return !this.lgcAnd(values);
  },

  lgcOr(values: IterableIterator<boolean>) {
    for (const value of values)
      if (value)
        return true;

    return false;
  },

  lgcNor(values: IterableIterator<boolean>) {
    return !this.lgcOr(values);
  },

  lgcXor(values: IterableIterator<boolean>) {
    return !this.lgcAnd(values) && !this.lgcNor(values);
  },

  lgcXnor(values: IterableIterator<boolean>) {
    return this.lgcAnd(values) || this.lgcNor(values);
  },

  mode(values: IterableIterator<boolean>) {
    let trues = 0, falses = 0;

    for (const value of values)
      value ? trues++ : falses++;

    return trues > falses;
  },

  rear(values: IterableIterator<boolean>) {
    return !this.mode(values);
  }
}



/**
 * Boolean Column Constraint
 * ====================================================================================================================
 */
export interface BooleanConstraints {
  notNull?: boolean;
}

export const booleanConstraints = {

  isValidConstraints(constraints: BooleanConstraints) {
    const props = ["notNull"];

    for (const key of Object.keys(constraints || {}))
      if (!props.includes(key))
        return false;

    return true;
  },

  check(value: boolean, constraints: BooleanConstraints, throwError = true) {
    for (const constName of Object.keys(constraints)) {
      try {        
          this[constName as 'notNull'](value, constraints[constName as 'notNull']);
  
      } catch (error: any) {
        if (throwError) throw error;
        return false;
      }
    }

    return true;
  },

  notNull(bool: boolean, value: boolean) {
    if (value && typeof bool === 'boolean')
      throw new BooleanConstraintError("value is null");
  }
}
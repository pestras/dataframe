// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT



/**
 * DataFrame Series Base Types
 * -----------------------------------------------
 */

export type SeriesType = 'boolean' | 'date' | 'datetime' | 'number' | 'string' | 'time';



/**
 * DataFrame Series Base Elemenet
 * -----------------------------------------------
 */

export interface SeriesElement<T = any> {
  value: T;
  key: number;
}



/**
 * DataFrame Record Merge Type
 * -----------------------------------------------
 */

export type MergeType = "inner" | "outter" | "left" | "right";



/**
 * Series Count Reducer
 * -----------------------------------------------
 */

 export type CountReducer = 'count' | 'stablesCount' | 'violationsCount' | 'nullCount';



/**
 * key generator
 * -----------------------------------------------
 */

export function generateKey(currKeys: number[]) {
  let newKey = currKeys.length;

  while (currKeys.includes(newKey))
    newKey++;

  return newKey;
}
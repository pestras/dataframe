// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

function compare(a: any, b: any) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function merge<T = number>(arr1: T[], arr2: T[], compareFn = compare) {
  const output: T[] = [];
  let i = 0, j = 0;

  while (i < arr1.length && j < arr2.length)
    output.push(compareFn(arr1[i], arr2[j]) < 0 ? arr1[i++] : arr2[j++]);

  if (i === arr1.length) output.push(...arr2.slice(j));
  else output.push(...arr1.slice(i));

  return output;
}

export function mergeSort<T = number>(arr: T[], compareFn = compare): T[] {
  const mid = Math.floor(arr.length / 2);
  return arr.length <= 1 ? arr : merge(mergeSort(arr.slice(0, mid), compareFn), mergeSort(arr.slice(mid), compareFn), compareFn);
}
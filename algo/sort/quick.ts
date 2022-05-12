// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

function compare(a: any, b: any) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function getPivot<T>(arr: T[], start = 0, end = arr.length - 1, compareFn = compare) {
  const pivot = arr[start];
  let swapIndex = start;

  for (let i = start + 1; i <= end; i++)
    if (compareFn(pivot, arr[i]) < 0) {
      swapIndex++;
      [arr[swapIndex], arr[i]] = [arr[i], arr[swapIndex]];
    }

  [arr[start], arr[swapIndex]] = [arr[swapIndex], arr[start]];

  return swapIndex;
}

export function quickSort<T>(arr: T[], compareFn = compare) {

  function helper(start = 0, end = arr.length - 1) {
    if (start >= end) return;

    let pivot = getPivot(arr, start, end, compareFn);
    helper(start, pivot - 1)
    helper(pivot + 1, end);
  }

  helper();

  return arr;
}
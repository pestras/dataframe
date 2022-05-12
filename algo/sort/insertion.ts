// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

function compare(a: any, b: any) {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function insertionSort<T = number>(arr: T[], compareFn = compare) {
  let len = arr.length;

  for (let i = 0; i < len - 1; i++) {
    for (let j = i + 1; j > 0; j--)
      if (compareFn(arr[j - 1], arr[j]) < 0)
        [arr[j], arr[j - 1]] = [arr[j - 1], arr[j]];
      else
        break;
  }
}
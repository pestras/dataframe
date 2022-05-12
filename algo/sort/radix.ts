// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

function getDigit(num: number, pos: number) {
  return Math.floor(Math.abs(num) / Math.pow(10, pos) % 10);
}

function digitCount(num: number) {
  return num === 0 ? 1 : Math.floor(Math.log10(Math.abs(num))) + 1;
}

function maxDigits(arr: number[]) {
  let max = 0;

  for (let i = 0; i < arr.length; i++)
    max = Math.max(max, digitCount(arr[i]));

  return max;
}

export function radixSort(arr: number[], reverse = false) {
  const md = maxDigits(arr);
  const len = arr.length;

  for (let k = 0; k < md; k++) {
    const buckets: number[][] = Array.from({ length: 10 }, () => []);

    if (reverse)
      for (let i = 0; i < len; i++)
        buckets[9 - getDigit(arr[i], k)].push(arr[i]);
    else
      for (let i = 0; i < len; i++)
        buckets[getDigit(arr[i], k)].push(arr[i]);

    arr = [].concat(...buckets);
  }

  return arr;
}
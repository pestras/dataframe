// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

export function getNumSuff(num: number) {
  const numSuffix = [null, 'st', 'nd', 'rd'];
  const str = "" + num;

  return str[0] === '1' ? 'th' : numSuffix[+str[1]] || 'th';
}
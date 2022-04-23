// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

export function pick<T extends object>(src: T, props: (string | number)[]) {
  const output: any = {};

  for (let prop of props)
    output[prop] = (src as any)[prop];

  return output;
}

export function omit<T extends object>(src: T, props: (string | number)[]) {
  const output: any = {};

  for (let prop in src)
    props.includes(prop) || (output[prop] = src[prop]);

  return output;
}
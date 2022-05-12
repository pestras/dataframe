// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

function singleGroupBy(list: any[] | IterableIterator<any>, prop: string | ((obj: any) => string)) {
  const output: any = {};

  for (const row of list) {
    const key = typeof prop === "string" ? prop : prop(row);

    if (!output[key]) output[key] = [];
    output[key].push(row);
  }

  return output;
}

export function groupBy(list: any[] | IterableIterator<any>, props: (string | ((obj: any) => string))[]) {
  if (props.length === 1) return singleGroupBy(list, props[0]);
  
  const group = singleGroupBy(list, props[0]);

  for (const key in group)
    group[key] = groupBy(group[key], props.slice(1));

  return group;
}

export function* collectArrays(data: any): Generator<any[]> {
  if (Array.isArray(data))
    yield data;

  if (data && typeof data === 'object')
    for (const key in data)
      yield* collectArrays(data[key]);

  return;
}
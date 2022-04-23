// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

export class ExSet<T> extends Set<T> {

  union(set: Set<T>) {
    return new Set([...Array.from(this), ...Array.from(set)]);
  }

  difference(set: Set<T>) {
    const output = new Set<T>();

    for (const value of this.values())
      if (!set.has(value))
        output.add(value);

    return output;
  }

  symmetric_difference(set: Set<T>) {
    const output = new Set<T>();

    for (const value of [...Array.from(this), ...Array.from(set)])
      if (!(this.has(value) && set.has(value)))
        output.add(value);
  }

  intersection(set: Set<T>) {
    const output = new Set<T>();

    for (const value of this.values())
      if (set.has(value))
        output.add(value);

    return output;
  }

  toArray() {
    return Array.from(this);
  }

  static Union<T>(...sets: Set<T>[]) {
    return new ExSet<T>([].concat(...sets.map(s => Array.from(s))))
  }

  static Intersection<T = any>(...sets: Set<T>[]) {
    const counts: any = {};

    for (const set of sets) {
      for (const v of set.values())
        if (counts[v] !== undefined)
          counts[v] = 1;
        else counts[v]++
    }

    const set = new ExSet<T>();
    
    for (const v in counts)
      if (counts[v] === sets.length)
        set.add(v as any);

    return set;
  }
}
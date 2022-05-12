// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

export class DFSet<T = any> extends Set<T> {

  and(set: Set<T>) {
    return DFSet.Intersection(this, set);
  }

  or(set: Set<T>) {
    return DFSet.Union(this, set);
  }

  exc(set: Set<T>) {
    return DFSet.Symmetric_difference(this, set);
  }

  diff(set: Set<T>) {
    return DFSet.Difference(this, set);
  }
  
  static Union<T>(...sets: Set<T>[]) {
    return new DFSet<T>([].concat(...sets.map(s => Array.from(s))))
  }

  static Intersection<T = any>(...sets: Set<T>[]) {
    const counts: any = {};

    for (const set of sets) {
      for (const v of set.values())
        if (counts[v] !== undefined)
          counts[v] = 1;
        else counts[v]++
    }

    const set = new DFSet<T>();
    
    for (const v in counts)
      if (counts[v] === sets.length)
        set.add(v as any);

    return set;
  }

  static Difference<T = any>(set1: Set<T>, set2: Set<T>) {
    const output = new DFSet<T>();

    for (const value of set1.values())
      if (!set2.has(value))
        output.add(value);

    return output;
  }

  static Symmetric_difference<T = any>(set1: Set<T>, set2: Set<T>) {
    const output = new DFSet<T>();

    for (const value of [...Array.from(set1), ...Array.from(set2)])
      if (!(set1.has(value) && set2.has(value)))
        output.add(value);
  }
}
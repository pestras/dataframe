// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

export type HashTableID = string | number;

export class HashTable<T = any> {
  private keyValueMap: { key: HashTableID, value: T }[][] = [];
  private _size = 0;

  constructor(readonly maxSize?: number) { }

  private hash(key: HashTableID) {
    if (typeof key === "number")
      return Math.pow(key * 10001, 2) % this.maxSize;

    const len = Math.min(10, key.length);
    let total = 1;

    for (let i = 0; i < len; i++)
      total += Math.pow(key.charCodeAt(i) * 10001, 3);

    return total % this.maxSize;
  }

  get size() {
    return this._size;
  }

  *[Symbol.iterator]() {
    for (const records of this.keyValueMap) {
      if (!records) continue;

      for (const rec of records)
        yield [rec.key, rec.value];
    }
  }

  *entries() {
    yield* this;
  }

  *keys() {
    for (const [k, _] of this)
      yield k;
  }

  *values() {
    for (const [_, v] of this)
      yield v;
  }

  set(key: HashTableID, value: T) {
    const index = this.hash(key);

    if (this.keyValueMap[index] === undefined)
      this.keyValueMap[index] = [];
    else {
      for (const record of this.keyValueMap[index])
        if (record.key === key) {
          record.value = value;
          return this;
        }
    }

    this.keyValueMap[index].push({ key, value });
    this._size++;
    return this;
  }

  get(key: HashTableID) {
    const index = this.hash(key);

    if (this.keyValueMap[index])
      for (const record of this.keyValueMap[index])
        if (record.key === key)
          return record.value;

    return null
  }

  remove(key: HashTableID) {
    const index = this.hash(key);

    if (this.keyValueMap[index]) {
      let idx = this.keyValueMap[index].findIndex(r => r.key === key);

      if (idx > -1) {
        this.keyValueMap[index].splice(idx, 1);
        this._size--;
      }
    }

    return this;
  }
}
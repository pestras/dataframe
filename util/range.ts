export class Range {
  /** Start Value */
  readonly start: number;
  /** End Value */
  readonly end: number;
  /** True when start value is smaller than end value */
  readonly ascending: boolean;
  /** The absolute value of the difference between the end value and the start value */
  readonly length: number;
  /** The mid value between start and end values */
  readonly median: number;

  constructor(range?: Range)
  constructor(start?: number, end?: number)
  constructor(start: number | Range = null, end: number = null) {

    if (start instanceof Range) {
      this.start = start.start ?? 0;
      this.end = start.end ?? 100;
    } else {
      this.start = start ?? 0;
      this.end = end ?? 100;
    }

    this.ascending = this.start < this.end;
    this.length = Math.abs(this.end - this.start);
    this.median = (this.start + this.end) / 2;
  }

  *[Symbol.iterator]() {
    for (let i = this.start; i <= this.end; i++)
      yield i;
  }

  clone(start: number = null, end: number = null) {
    return new Range(start ?? this.start, end ?? this.end);
  }

  /** Check if a given value is between the start and end values */
  inRange(value: number) {
    return this.ascending
     ? value > this.start && value < this.end
     : value < this.start && value > this.end;
  }

  toArray() {
    return Array.from(this);
  }

  /** 
   * Returns the percentage of the given value between the start and end values.
   * 
   * When *strict* is false the percentage may exceeds the range between 0 and 100 
   */
  getPercent(num: number, strict = true) {
    const percent = this.ascending
      ? num * 100 / this.length
      : 100 - (num * 100 / this.length);

    return !strict
      ? percent
      : percent > 100 ? 100 : (percent < 0 ? 0 : percent);
  }

  equal(range: Range) {
    return this.start === range.start && this.end === range.end;
  }

  match(range: Range) {
    return this.length === range.length;
  }

  /**
   * Returns a new range which its start is minimum start among the given ranges, 
   * and its end is the maximum end among the given ranges.
   */
  static Merge(...ranges: Range[]) {
    return new Range(
      Math.min(...ranges.map(t => t.start)),
      Math.max(...ranges.map(t => t.end))
    );
  }

  /** Return the total sum of all given ranges lengths. */
  static Sum(...ranges: Range[]) {
    return ranges.reduce((total, r) => total + r.length, 0);
  }

  /**
   * Returns a new range which its start is the result of summing all given ranges start values,
   * and its end id the result of summing all given ranges end values.
   * 
   */
  static MergeSum(...ranges: Range[]) {
    return new Range(
      ranges.reduce((total, r)=> total + (r.start || 0), 0),
      ranges.reduce((total, r) => total + (r.end || 0), 0)
    );
  }
}
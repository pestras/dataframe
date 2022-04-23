// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { DateTimeRange } from "./range";

export enum MonthsIntervals {
  MONTHLY = 1,
  TWO_MONTHS = 2,
  QUARTERS = 3,
  THIRDS = 4,
  BIANNUAL = 6,
  ANNUAL = 12
}


/**
 * MonthlyDateRange
 * =============================================================================================
 */
export class MonthlyDateRange extends DateTimeRange {
  readonly interval: MonthsIntervals;
  readonly intervals: Readonly<Date[]>;

  constructor(start?: Date, end?: Date, interval = MonthsIntervals.MONTHLY) {
    let s: Date;
    let e: Date;
    
    if (start instanceof Date)
      (s = new Date(start)).setDate(1);
    else
      s = new Date(new Date().getFullYear(), 0, 1, 0, 0, 0, 0);
    
    if (end instanceof Date) {
      e = new Date(end);

      if (e.getDate() !== 1) {
        e.setMonth(e.getMonth() + 1);
        e.setDate(1);
      }

    } else
      e = new Date(new Date().getFullYear() + 1, 0, 1, 0, 0, 0, 0);

    super(s, e);

    this.interval = interval;
    this.intervals = this.getIntervals();
  }

  
  // Methods
  // -----------------------------------------------------------------------------------------------------
  /**
   * Create Dates list of all months included in the range based on its interval.
   * @param includeStart **boolean** include range start date, defaults to true.
   * @returns Date[]
   */
  private getIntervals() {
    const curr = new Date(this.start);
    const result = [new Date(this.start)];
    
    curr.setMonth(0);

    for (let i = 0; i < this.totalMonths; i++) {
      curr.setMonth(curr.getMonth() + this.interval);

      if (this.include(curr))
        result.push(curr);
    }

    return result;
  }

  /**
   * Gets the nearest interval date according to the selected mode:  
   * - **'backward'**: selects the nearest past date
   * - **'forward'**: selects nearest next date
   * - **'auto'**: compares both options and selects which is nearest.
   * @param date **Date** date used for comparison, defaults to new Date().
   * @param mode **'backward' | 'auto' | 'forward'** select mode, defaults to 'backward'
   * @returns Date
   */
  getNearestInterval(date = new Date, mode: 'backward' | 'auto' | 'forward' = 'backward') {
    const ts = date.getTime();
    let currInterval = this.intervals[0];

    for (let d of this.intervals) {
      if (ts > d.getTime())
        currInterval = d;
      else {
        if (mode === "backward")
          return new Date(currInterval);
        else if (mode === 'forward')
          return new Date(d);
        else
          return ts - currInterval.getTime() < d.getTime() - ts
            ? new Date(currInterval)
            : new Date(d);
      }
    }

    return new Date(currInterval);
  }
}
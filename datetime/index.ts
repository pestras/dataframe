// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT



// Format Date Utility
// =========================================================================================================================================
const keys = ['D', 'o', 'd', 'Y', 'h', 'm', 's'];

const options: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
  weekday: "short"
}

export function formatDate(date: Date | string | number, pattern?: string, lang = 'en-US', timeZone?: string) {
  const regex = /^(\w+),\s(\d+)\/(d+)\/(d+),\s(d+):(d+):(d+)$/; // "Mon, 3/21/2022, 21:08:45"
  const str = new Date(date).toLocaleString(lang, { timeZone, ...options });
  const data: any = {};
  const values = regex.exec(str);

  if (values === null)
    return "";

  for (let i = 0; i < values.length - 1; i++)
    data[keys[i]] = values[i + 1];

  data.O = new Date(date).toLocaleString(lang, { month: 'long', timeZone });
  data.y = data.Y.slice(2);

  return (pattern || 'Y/o/d h:m:s').replace(/\w+/g, (match: string) => {
    return data[match] || match;
  });
}




// Date Time Delta String Utility
// =========================================================================================================================================
export type DateTimeDeltaStrUnits = `${number}${'yr' | 'mo' | 'dy' | 'hr' | 'mn' | 'sc'}`[];

export function parseDeltaStr(delta: DateTimeDeltaStrUnits) {
  const pattern = /(-?\d+)([a-zA-Z]{2})/;
  const tz = new Date().getTimezoneOffset();
  const baseHoures = Math.floor(tz / -60);
  const baseMinutes = tz % -60;

  const values = [1970, 0, 1, baseHoures, baseMinutes, 0];

  for (const part of delta) {
    if (!part)
      continue;

    let val: number;
    let unit: string;

    const res = pattern.exec(part.trim());

    if (!res)
      continue;

    val = +res[1];

    if (!val)
      continue;

    unit = res[2];

    switch (unit.toLowerCase()) {
      case 'yr':
        values[0] += val;
        break;
      case 'mo':
        values[1] += val;
        break;
      case 'dy':
        values[2] += val;
        break;
      case 'hr':
        values[3] += val;
        break;
      case 'mn':
        values[4] += val;
        break;
      case 'sc':
        values[5] += val;
        break;
    }
  }

  return new Date(values[0], values[1], values[2], values[3], values[4], values[5], 0).getTime();
}




// Create Date Time Series By Spliting Range
// =========================================================================================================================================
/**
   * Splits the given range into the given intervals count.
   * @param start **Date**
   * @param end **Date**
   * @param intervalsCount **number**
   * @returns Generator<Date>
   */
export function* dateTimeSeries(start: Date, end: Date, intervalsCount: number) {
  const startMill = start.getTime();
  const intervalLength = (end.getTime() - start.getTime()) / intervalsCount;

  for (let i = 0; i < intervalsCount; i++)
    yield new Date(startMill + (i * intervalLength));
}

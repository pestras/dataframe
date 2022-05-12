// Copyright (c) 2022 Pestras
// 
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

import { getDayOfYear } from ".";
import { gettzName, gettzOffset } from "./tz";
import { getNumSuff } from "./util";

// Years -- 'YY': 85, 'YYYY': 1985
// Quarters -- 'Q': 4, 'Qo': 4th
// Months -- 'M': 6, 'Mo': 6th, 'MM': 06, 'MMM': Jun, 'MMMM': June
// Weeks -- 'w': 3, 'wo': 3rd, 'ww': 03
// Days of Month -- 'D': 1, 'Do': 1st, 'DD': 01
// Days of Year -- 'DDD': 41, 'DDDo': 41st, 'DDDD': 041
// Days of Week -- 'd': 6. 'dd': 06, 'ddd': Sat, 'dddd': Saturday
// 24 Hours -- 'H': 15, 'HH': 05
// 12 Hours -- 'h': 1, 'hh': 05
// Minutes -- 'm': 5, 'mm': 05
// Seconds -- 's': 3, 'ss': 03
// Milliseconds -- 'S': 1, 'SS': 12, 'SSS': 123
// AM/PM -- 'a': am, 'A': AM
// TimeZone Offset -- 'Z': +07:30

function getMonthData(date: Date, MM: string, lang: string, timeZone: string) {
  const data: any = {};
  data.M = +MM < 10 ? MM[1] : MM;

  data.Mo = data.M + getNumSuff(+MM);
  data.MMMM = new Date(date).toLocaleString(lang, { month: 'long', timeZone });
  data.MMM = lang.includes('en') ? data.MMMM.slice(0, 3) : data.MMMM;

  return data;
}


// Day data
// ----------------------------------------------------------

function getDayData(date: Date, DD: string, lang: string, timeZone: string) {
  const data: any = {};
  data.dddd = new Date(date).toLocaleString(lang, { weekday: 'long', timeZone });
  data.ddd = lang.includes('en') ? data.dddd.slice(0, 3) : data.dddd;
  data.dd = lang.includes('en') ? data.dddd.slice(0, 2) : data.dddd;
  data.d = date.getDay();
  data.D = +DD < 10 ? DD[1] : DD;
  data.Do = data.D + getNumSuff(+DD);;
  data.DDD = "" + getDayOfYear(date);
  data.DDDo = data.DDD + getNumSuff(+data.DDD);
  data.DDDD = +data.DDD < 10 ? '00' + data.DDD : +data.DDD < 100 ? '0' + data.DDD : data.DDD;

  return data;
}



// Week data
// ----------------------------------------------------------
function getWeekData(dayOfYear: number) {
  const data: any = {};
  data.w = '' + Math.ceil(dayOfYear / 7);
  data.ww = +data.w < 10 ? '0' + data.w : data.w;
  data.wo = data.w + getNumSuff(+data.w);

  return data;
}



// Hour data
// ----------------------------------------------------------
function getHourDate(HH: string) {
  const data: any = {};
  data.H = HH[0] == '0' ? HH[1] : HH;
  data.h = +HH > 12 ? "" + (+HH - 12) : HH;
  data.hh = data.h.length == 1 ? "0" + data.h : data.h;

  return data;
}

// Format Functions
// ============================================================================

// Datetime format
// -----------------------------------------------------------

export function formatDatetime(date: number | string | Date, format?: string, lang = 'en-US', city?: string) {
  const timeZone = !!city ? gettzName(city) || Intl.DateTimeFormat().resolvedOptions().timeZone : Intl.DateTimeFormat().resolvedOptions().timeZone;
  const regex = /^(\d{2})\/(\d{2})\/(\d{4}),\s(\d{2}):(\d{2}):(\d{2})/;
  const keys = ['MM', 'DD', 'YYYY', 'HH', 'mm', 'ss'];
  const data: any = {};
  const str = new Date(date).toLocaleString('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  date = new Date(date);

  const values = regex.exec(str);

  if (values === null)
    return "";

  for (let i = 0; i < values.length - 1; i++)
    data[keys[i]] = values[i + 1];

  // complete year data
  data.YY = data.YYYY.slice(2);

  // complete day, month and hour data
  Object.assign(
    data,
    getDayData(date, data.DD, lang, timeZone),
    getMonthData(date, data.MM, lang, timeZone),
    getHourDate(data.HH)
  );

  // completeing minutes, seconds and milliseconds data
  data.m = data.mm[0] == '0' ? data.mm[1] : data.mm;
  data.s = data.ss[0] == '0' ? data.ss[1] : data.ss;
  data.SSS = "" + date.getMilliseconds();
  data.SS = "" + Math.round(+data.SSS / 10);
  data.S = "" + Math.round(+data.SS / 10);

  // add am pm
  data.a = +data.H > 12 ? 'pm' : 'am';
  data.A = data.a.toUpperCase();
  
  // timezone offset
  data.Z = gettzOffset(timeZone)?.string || '';

  // adding week data
  Object.assign(data, getWeekData(+data.DDD));

  // add quarter data
  data.Q = "" + Math.ceil(+data.M / 3);
  data.Qo = data.Q + getNumSuff(+data.Q);

  return (format || 'YYYY/MM/DD HH:mm:ss').replace(/\w+/g, (match: string) => {
    return data[match] || match;
  });
}



// Date format
// -----------------------------------------------------------

export function formatDate(date: number | string | Date, format?: string, lang = 'en-US', city?: string) {
  const timeZone = !!city ? gettzName(city) || Intl.DateTimeFormat().resolvedOptions().timeZone : Intl.DateTimeFormat().resolvedOptions().timeZone;
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})/;
  const keys = ['MM', 'DD', 'YYYY'];
  const data: any = {};
  const str = new Date(date).toLocaleString('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  date = new Date(date);

  const values = regex.exec(str);

  if (values === null)
    return "";

  for (let i = 0; i < values.length - 1; i++)
    data[keys[i]] = values[i + 1];

  // complete year data
  data.YY = data.YYYY.slice(2);

  // complete day, month and hour data
  Object.assign(
    data,
    getDayData(date, data.DD, lang, timeZone),
    getMonthData(date, data.MM, lang, timeZone)
  );

  // adding week data
  Object.assign(data, getWeekData(+data.DDD));

  // add quarter data
  data.Q = "" + (Math.ceil(+data.M / 3));
  data.Qo = data.Q + getNumSuff(+data.Q);

  return (format || 'YYYY-MM-DD').replace(/\w+/g, (match: string) => {
    return data[match] || match;
  });
}

// Datetime format
// -----------------------------------------------------------

export function formatTime(date: number | string | Date, format?: string, city?: string) {
  const timeZone = !!city ? gettzName(city) || Intl.DateTimeFormat().resolvedOptions().timeZone : Intl.DateTimeFormat().resolvedOptions().timeZone;
  const regex = /^(\d{2}):(\d{2}):(\d{2})/;
  const keys = ['HH', 'mm', 'ss'];
  const data: any = {};
  const str = new Date(date).toLocaleString('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  date = new Date(date);

  const values = regex.exec(str);

  if (values === null)
    return "";

  for (let i = 0; i < values.length - 1; i++)
    data[keys[i]] = values[i + 1];

  // complete day, month and hour data
  Object.assign(data, getHourDate(data.HH));

  // completeing minutes, seconds and milliseconds data
  data.m = data.mm[0] == '0' ? data.mm[1] : data.mm;
  data.s = data.ss[0] == '0' ? data.ss[1] : data.ss;
  data.SSS = "" + date.getMilliseconds();
  data.SS = "" + Math.round(+data.SSS / 10);
  data.S = "" + Math.round(+data.SS / 10);

  // add am pm
  data.a = +data.H > 12 ? 'pm' : 'am';
  data.A = data.a.toUpperCase();
  
  // timezone offset
  data.Z = gettzOffset(timeZone)?.string || '';

  return (format || 'HH:mm:ss').replace(/\w+/g, (match: string) => {
    return data[match] || match;
  });
}



// Parse Functions
// ===============================================================================


// Parse Datetime
// -----------------------------------------------------------

export function parseDatetime(date: string, format: string) {
  const groups = {
    year: ['YYYY'],
    month: ['MM'],
    day: ['DD'],
    hour: ['HH'],
    minutes: ['mm'],
    seconds: ['ss'],
    ms: ['SSS','SS','S']
  };

  const data: any = {};

  for (const unit in groups) {

    for (const sym of groups[unit as 'year']) {
      const index = format.indexOf(sym);

      if (index === -1)
        continue;

      data[unit] = date.slice(index, index + sym.length);
      break;
    }
  }

  return new Date(data.year, data.month, data.day, data.hour, data.minutes, data.seconds, data.ms);
}


// Parse Date
// -----------------------------------------------------------

export function parseDate(date: string, format = 'YYYY-MM-DD') {
  const groups = {
    year: ['YYYY'],
    month: ['MM'],
    day: ['DD']
  };

  const data: any = {};

  for (const unit in groups) {

    for (const sym of groups[unit as 'year']) {
      const index = format.indexOf(sym);

      if (index === -1)
        continue;

      data[unit] = date.slice(index, index + sym.length);
      break;
    }
  }

  return new Date(data.year, data.month, data.day, 0, 0, 0, 0);
}


// Parse Time
// -----------------------------------------------------------

export function parseTime(date: string, format = 'HH:mm:ss') {
  const groups = {
    hour: ['HH'],
    minutes: ['mm'],
    seconds: ['ss'],
    ms: ['SSS','SS','S']
  };

  const data: any = {};

  for (const unit in groups) {

    for (const sym of groups[unit as 'hour']) {
      const index = format.indexOf(sym);

      if (index === -1)
        continue;

      data[unit] = date.slice(index, index + sym.length);
      break;
    }
  }

  return new Date(1970, 0, 1, data.hour, data.minutes, data.seconds, data.ms);
}
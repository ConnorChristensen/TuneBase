function leadingZero(string, regex, number) {
  if (number < 10) {
    return string.replace(regex, '0' + number)
  }
  return string.replace(regex, number)
}

module.exports = {
  unix: function(seconds) {
    return new Date(seconds * 1000)
  },
  getUnix: function(date) {
    return Math.floor(date.getTime() / 1000)
  },
  format: function(info) {
    const date = info.date
    let form = info.format

    // reaplce y with the year
    form = form.replace(/y{4}/gi, date.getFullYear())
    // replace yy with the last two characters of the full year
    form = form.replace(/y{1,2}/gi, (date.getFullYear()).toString().substring(2))

    // replace m with the month
    form = leadingZero(form, /m{2}/gi, date.getMonth() + 1)
    form = form.replace(/m{1,2}/gi, date.getMonth() + 1)

    // replace d with day
    form = leadingZero(form, /d{2}/gi, date.getDate())
    form = form.replace(/d{1,2}/gi, date.getDate())

    // replace h with hour
    form = leadingZero(form, /h{2}/gi, date.getHours())
    form = form.replace(/h{1,2}/gi, date.getHours())

    // replace i with minute
    form = leadingZero(form, /i{1,2}/gi, date.getMinutes())

    return form
  },
  msToTime: function(s) {
    const ms = s % 1000
    s = (s - ms) / 1000
    const secs = s % 60
    s = (s - secs) / 60
    const mins = s % 60
    const hrs = (s - mins) / 60
    return {
      h: hrs,
      m: mins,
      s: secs,
      ms: ms
    }
  },
  // adds two time objects together
  addTime: function(t1, t2) {
    // ammount of rollover time
    let msRoll, sRoll, mRoll
    let ms, s, m, h

    // ms
    ms = t1.ms + t2.ms
    msRoll = Math.floor(ms / 1000)
    ms = ms % 1000

    // s
    s = t1.s + t2.s + msRoll
    sRoll = Math.floor(s / 60)
    s = s % 60

    // m
    m = t1.m + t2.m + sRoll
    mRoll = Math.floor(m / 60)
    m = m % 60

    // h
    h = t1.h + t2.h + mRoll

    return {
      h: h,
      m: m,
      s: s,
      ms: ms
    }
  }
}

function filterBrackets(value) {
  if (value !== '<' && value !== '>' && value !== '') {
    return value
  }
}

module.exports = {
  parseSong: function(rawData) {
    // our empty song object to be filled with content
    let song = {}
    // split our raw data by new lines
    let splitData = rawData.split(/\n/)
    // remove all empty spaces
    splitData = splitData.filter(Boolean)
    // for each element in the array
    splitData.forEach(function(element) {
      // remove the whitespace on both sides
      element = element.trim()
      // remove the key tags
      element = element.replace(/<(\/key|key)>/g, '')
      // remove the closing tags
      element = element.replace(/<\/.*>/g, '')
      // remove the back slashes in the </true> tags
      element = element.replace(/\//g, '')
      // split based on the bracket tags to get at the data types
      element = element.split(/(<|>)/g)
      // remove all empty spaces and open/close brackets
      element = element.filter(filterBrackets)
      // if there are 3 elements in the array
      // it has a data type and a value after it
      if (element.length === 3) {
        // find the data type of the info matching the key
        // and cast the info to that type, then store it with
        // that key
        if (element[1] === 'integer') {
          song[element[0]] = Number(element[2])
        } else if (element[1] === 'string') {
          song[element[0]] = element[2]
        } else if (element[1] === 'date') {
          song[element[0]] = new Date(element[2])
        }

        // if there is only 2 elements, it means its a boolean
      } else if (element.length === 2) {
        song[element[0]] = Boolean(element[1])
      }
    })
    // return our converted data type
    return song
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

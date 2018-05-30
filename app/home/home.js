let c3 = require('c3')
let db = require('../utils/database.js')
let commaNumber = require('comma-number')
const timeFormat = 'MM/DD/YY H:mm'
const moment = require('moment')
const Store = require('electron-store')
const store = new Store()
const parse = require('../utils/parser.js')

// eslint-disable-next-line
let app = new Vue({
  el: '#app',
  data: {
    songCount: 0,
    updateTime: '',
    totalListenTime: ''
  },
  beforeMount: async function() {
    db.init()
    this.songCount = commaNumber((await db.getAllSongs()).length)
    const updateUnix = db.timeToUpdate(store.get('lastRead'))
    this.updateTime = moment.unix(updateUnix).format(timeFormat)

    let time = {h: 0, m: 0, s: 0, ms: 0}
    let artists = await db.getAllArtists()
    for (let artist of artists) {
      let artistTime = await db.getTotalPlayTimeByArtist(artist)
      time = parse.addTime(time, parse.msToTime(artistTime))
    }
    if (time.h > 1000) {
      let days = Math.floor(time.h / 24)
      time.h = time.h % 24
      this.totalListenTime = `${days}d ${time.h}h ${time.m}m ${time.s}s`
    } else {
      this.totalListenTime = `${commaNumber(time.h)}h ${time.m}m ${time.s}s`
    }
  }
})

c3.generate({
  bindto: '#era',
  data: {
    columns: [
      ['1970', 5],
      ['1980', 5],
      ['1990', 20],
      ['2000', 35],
      ['2010', 35]
    ],
    type: 'donut'
  },
  donut: {
    title: 'Songs by Era'
  }
})

c3.generate({
  bindto: '#genre',
  data: {
    columns: [
      ['1970', 5],
      ['1980', 5],
      ['1990', 20],
      ['2000', 35],
      ['2010', 35]
    ],
    type: 'donut'
  },
  donut: {
    title: 'Songs by Genre'
  }
})

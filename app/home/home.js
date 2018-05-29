let c3 = require('c3')
let db = require('../utils/database.js')
let commaNumber = require('comma-number')
const timeFormat = 'MM/DD/YY H:mm'
const moment = require('moment')
const Store = require('electron-store')
const store = new Store()

// eslint-disable-next-line
let app = new Vue({
  el: '#app',
  data: {
    songCount: 0,
    updateTime: ''
  },
  beforeMount: async function() {
    db.init()
    this.songCount = commaNumber((await db.getAllSongs()).length)
    const updateUnix = db.timeToUpdate(store.get('lastRead'))
    this.updateTime = moment.unix(updateUnix).format(timeFormat)
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

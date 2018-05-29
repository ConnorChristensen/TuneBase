let c3 = require('c3')
let db = require('../utils/database.js')
let commaNumber = require('comma-number')

let app = new Vue({
  el: '#app',
  data: {
    songCount: 0
  },
  beforeMount: async function() {
    db.init()
    this.songCount = commaNumber( (await db.getAllSongs()).length )
  }
})

let era = c3.generate({
  bindto: '#era',
  data: {
    columns: [
      ['1970', 5],
      ['1980', 5],
      ['1990', 20],
      ['2000', 35],
      ['2010', 35],
    ],
    type : 'donut'
  },
  donut: {
    title: "Songs by Era"
  }
})

let genre = c3.generate({
  bindto: '#genre',
  data: {
    columns: [
      ['1970', 5],
      ['1980', 5],
      ['1990', 20],
      ['2000', 35],
      ['2010', 35],
    ],
    type : 'donut'
  },
  donut: {
    title: "Songs by Genre"
  }
})

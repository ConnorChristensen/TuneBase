let c3 = require('c3')

let app = new Vue({
  el: '#app'
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

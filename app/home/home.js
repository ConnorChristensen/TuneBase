let c3 = require('c3')
let db = require('../utils/database.js')
let commaNumber = require('comma-number')
const time = require('../utils/time.js')
const Store = require('electron-store')
const store = new Store()
const d3 = require('d3')

// eslint-disable-next-line
let app = new Vue({
  el: '#app',
  data: {
    songCount: 0,
    updateTime: '',
    totalListenTime: '',
    totalArtistTime: {},
    totalAlbumTime: {}
  },
  beforeMount: async function() {
    db.init()
    const allSongs = await db.getAllSongs()
    this.songCount = commaNumber(allSongs.length)
    const updateUnix = db.timeToUpdate(store.get('lastRead'))
    this.updateTime = time.format({
      date: time.unix(updateUnix),
      format: 'mm/dd/yy hh:mm'
    })

    // calculate the decade division
    let decades = {
      unknown: 0
    }
    let genres = {
      unknown: 0
    }

    for (let song of allSongs) {
      // round the year to the decade
      let decade = Math.floor(song.year / 10) * 10
      // if the year is defined
      if (song.year) {
        // if the decade is defined
        if (decades[decade]) {
          decades[decade] += 1
        } else {
          decades[decade] = 1
        }
      } else {
        decades.unknown += 1
      }

      // if the song genre exits
      if (song.genre) {
        if (genres[song.genre]) {
          genres[song.genre] += 1
        } else {
          genres[song.genre] = 1
        }
      } else {
        genres.unknown += 1
      }
    }

    // convert the era object into an array of arrays
    let eraData = []
    for (let key of Object.keys(decades)) {
      eraData.push([key, decades[key]])
    }

    c3.generate({
      bindto: '#era',
      data: {
        columns: eraData,
        type: 'donut'
      },
      donut: {
        label: {
          format: function(value, ratio, id) {
            return d3.format('')(value)
          }
        },
        title: 'Songs by Era'
      }
    })

    let genreData = []
    for (let key of Object.keys(genres)) {
      // as long as the genre makes up more than one percent of the library
      if (genres[key] > (allSongs.length * 0.01)) {
        genreData.push([key, genres[key]])
      }
    }
    c3.generate({
      bindto: '#genre',
      data: {
        columns: genreData,
        type: 'donut'
      },
      donut: {
        label: {
          format: function(value, ratio, id) {
            return d3.format('')(value)
          }
        },
        title: 'Songs by Genre'
      }
    })

    let albums = await db.getAllAlbums()
    let timeByAlbum = {}
    for (let album of albums) {
      let albumTime = await db.getTotalPlayTimeByAlbum(album)
      timeByAlbum[album] = albumTime
    }
    let topListAlbum = Object.keys(timeByAlbum).sort((a, b) => timeByAlbum[b] - timeByAlbum[a])
    let albumTime
    for (let x = 0; x < 7; x += 1) {
      albumTime = time.msToTime(timeByAlbum[topListAlbum[x]])
      this.totalAlbumTime[topListAlbum[x]] = `${albumTime.h}h ${albumTime.m}m ${albumTime.s}s`
    }

    // calculate the total play time
    let totalTime = { h: 0, m: 0, s: 0, ms: 0 }
    let artists = await db.getAllArtists()
    // will store the total play time by artist
    let timeByArtist = {}
    for (let artist of artists) {
      let artistTime = await db.getTotalPlayTimeByArtist(artist)
      // store the artist time in an object for processing later
      timeByArtist[artist] = artistTime
      totalTime = time.addTime(totalTime, time.msToTime(artistTime))
    }
    if (totalTime.h > 1000) {
      let days = Math.floor(totalTime.h / 24)
      totalTime.h = totalTime.h % 24
      this.totalListenTime = `${days}d ${totalTime.h}h ${totalTime.m}m ${totalTime.s}s`
    } else {
      this.totalListenTime = `${commaNumber(totalTime.h)}h ${totalTime.m}m ${totalTime.s}s`
    }

    // organized list of keys from greatest to least
    let topList = Object.keys(timeByArtist).sort((a, b) => timeByArtist[b] - timeByArtist[a])
    for (let x = 0; x < 7; x += 1) {
      totalTime = time.msToTime(timeByArtist[topList[x]])
      this.totalArtistTime[topList[x]] = `${totalTime.h}h ${totalTime.m}m ${totalTime.s}s`
    }
  }
})

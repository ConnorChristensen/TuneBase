// create a dialog
const db = require('../utils/database.js')
const parse = require('../utils/parser.js')
const moment = require('moment')
const c3 = require('c3')

const Store = require('electron-store')
const store = new Store()

// the vue object
// eslint-disable-next-line no-unused-vars
let app

/*****************************************************
*********** MAIN FUNCTION START OF PROGRAM ***********
*****************************************************/
;(async function() {
  // set up the database
  db.init()

  // get the last read time of the file
  let lastRead = store.get('lastRead')

  // the raw info where we will store our song info
  let songs = []

  // if it is time to update the data set
  if (!lastRead || db.timeToUpdate(lastRead) <= moment().unix()) {
    // show the loading icon
    document.getElementById('loadingIcon').style.display = 'block'
    // parse the file and get the songs
    songs = db.getSongsFromFile(db.getPath())
    // store the current time in the database as the time last read
    store.set('lastRead', moment().unix())
    // log data runs async, but we want it to be done before we continue
    await db.logData(songs)
  }
  // get all songs from the db, and overwrite the songs from the read in file
  // the read in file has slightly different key values from what is in the database
  songs = await db.getAllSongs()
  // hide the loading icon
  document.getElementById('loadingIcon').style.display = 'none'

  let tree = buildSongTree(songs)
  let artists = buildArtistsArray(tree)

  // create our vue instance
  // eslint-disable-next-line
  app = new Vue({
    el: '#app',
    data: {
      tree: tree,
      artists: artists,
      albums: [],
      songs: [],
      selected: {
        artist: '',
        album: '',
        song: ''
      },
      album: {
        songs: 0,
        playTime: 0,
        playCount: 0,
        year: 0,
        genre: '',
        rating: 0
      },
      artist: {
        songs: 0,
        playTime: 0,
        playCount: 0,
        yearRange: {},
        genre: '',
        rating: 0
      }
    },
    watch: {
      'selected.artist': async function() {
        // clear all albums
        this.albums = []
        // for every album under the artist
        for (let albumKey in this.tree[this.selected.artist]) {
          // add that album to our array
          this.albums.push(albumKey)
        }

        // update artist info
        const artistSongs = await db.getAllArtistSongs(this.selected.artist)
        this.artist.songs = artistSongs.length

        // play count
        // reset it to 0 when we change artists
        this.artist.playCount = 0
        for (let song of artistSongs) {
          this.artist.playCount += song.playCount
        }

        // play time
        let time = parse.msToTime(await db.getTotalPlayTimeByArtist(this.selected.artist))
        this.artist.playTime = `${time.h}h ${time.m}m ${time.s}s`

        this.artist.yearRange = await db.artistRangeYear(this.selected.artist)
        this.artist.rating = await db.averageArtistRating(this.selected.artist)

        this.artist.genre = await db.getArtistGenre(this.selected.artist)
      },
      'selected.album': async function() {
        // get all songs on that album made by that artist
        const albumSongs = await db.getAllSongsOnAlbumByArtist(this.selected.album, this.selected.artist)

        this.album.songs = albumSongs.length
        let time = parse.msToTime(await db.getTotalPlayTimeByAlbum(this.selected.album))
        this.album.playTime = `${time.h}h ${time.m}m ${time.s}s`

        // play count
        // reset it to 0 when we change artists
        this.album.playCount = 0
        for (let song of albumSongs) {
          this.album.playCount += song.playCount
        }
        this.album.year = albumSongs[0].year
        this.album.genre = albumSongs[0].genre
        this.album.rating = await db.averageAlbumRating(this.selected.album)
        this.album.rating += '/100'

        // clear all songs
        this.songs = []
        // push all song names into the songs array
        for (let song of albumSongs) {
          this.songs.push(song.name)
        }

        // init our chart data
        let chartData = {
          // links the time x values to the play count y values
          xs: {},
          // holds the play counts and the play times
          columns: []
        }
        // for every song in that album by that artist
        for (let song of albumSongs) {
          // get the play history of that song
          let history = await db.getPlayHistory(song.id)
          // set our play count data to have the name of the song
          let playCountData = [song.name]
          // set our time data to have the name of the song and " Time"
          let timeData = [`${song.name} Time`]
          // add in our data, a column with our play count and time
          chartData.columns.push(playCountData.concat(history.playCount))
          chartData.columns.push(timeData.concat(history.date))
          // bind the play count and time arrays together in c3
          // eg. song X Time is the array of dates for song X play counts
          chartData.xs[song.name] = `${song.name} Time`
        }
        c3.generate({
          bindto: '#chart',
          data: {
            xs: chartData.xs,
            xFormat: '%m/%d/%Y %H:%M',
            columns: chartData.columns
          },
          zoom: {
            enabled: true
          },
          axis: {
            x: {
              type: 'timeseries', // the x axis has a timeseries data type
              tick: {
                // the format shown when the mouse hovers over that dot
                format: '%m/%d %H:%M'
                // fit: false, if you want to keep the x axis ticks from sticking to the data points
                // count: 4 if you want to set the ticks to a fixed ammount
              }
            }
          }
        })
      },
      'selected.song': function() {
        db.getSongFromAlbum(this.selected.song, this.selected.album)
          .then(songResponse => {
            return db.getPlayHistory(songResponse.id)
          }).then(function(e) {
            // deep copy the array
            let values = e.playCount.slice()
            values.splice(0, 1)
            c3.generate({
              bindto: '#chart',
              data: {
                x: 'date',
                xFormat: '%m/%d/%Y %H:%M',
                columns: [e.date, e.playCount]
              },
              axis: {
                x: {
                  type: 'timeseries', // the x axis has a timeseries data type
                  tick: {
                    // the format shown when the mouse hovers over that dot
                    format: '%m/%d %H:%M'
                    // fit: false, if you want to keep the x axis ticks from sticking to the data points
                    // count: 4 if you want to set the ticks to a fixed ammount
                  }
                }
              }
            })
          })
      }
    }
  })
})()

function buildSongTree(songs) {
  // shorthand variables
  let artist = ''
  let album = ''
  let tree = {}

  for (let song of songs) {
    // shorthand variables
    artist = song.artist
    album = song.album

    // if the tree does not have that artist
    if (!tree.hasOwnProperty(artist)) {
      // create an artist object for albums
      tree[artist] = {}
    }

    // if the tree does not have that album
    if (!tree[artist].hasOwnProperty(album)) {
      // create a song array
      tree[artist][album] = []
    }

    // add the song to the album array in the artist object
    tree[artist][album].push(song.name)
  }
  return tree
}

function buildArtistsArray(tree) {
  let sortedArtistArray = []
  // for every artist in the song tree add the artist to an array
  for (let artistKey in tree) {
    sortedArtistArray.push(artistKey)
  }
  sortedArtistArray.sort()
  return sortedArtistArray
}

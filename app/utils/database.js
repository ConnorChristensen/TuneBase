// import a file reader
const fs = require('fs')
const dexie = require('dexie')
const moment = require('moment')
// for creating the hash of the artist name, album and song to make the ID
const sha1 = require('sha1')
const parse = require('../utils/parser.js')

const timeFormat = 'MM/DD/YY H:mm'
// access to stored info in the config file
const Store = require('electron-store')
const store = new Store()
// interact with the user through popup boxes
const { dialog } = require('electron').remote

let db

module.exports = {
  init: function() {
    db = new dexie.Dexie('iTunesData')
    db.version(1).stores({
      songs: 'id, [album+name], [album+artist], name, artist, year, playCount, dateModified, dateAdded, rating, albumRating, length, size, trackNumber, bitRate, playDate, album, genre',
      playCount: '++id, trackID, date, playCount'
    })
  },
  getDB: function() {
    return db
  },
  getTables: function() {
    return db.tables
  },
  tableExists: function(name) {
    try {
      db.table(name)
    } catch (e) {
      return false
    }
    return true
  },
  getTable: function(name) {
    try {
      db.table(name)
    } catch (e) {
      return null
    }
    return db.table(name)
  },
  destroy: function() {
    dexie.delete('iTunesData')
  },
  getAllSongs: async function() {
    return db.songs.toArray()
  },
  getAllSongsOnAlbumByArtist: async function(album, artist) {
    return db.songs.where(['album', 'artist']).equals([album, artist]).toArray()
  },
  getSongFromAlbum: async function(song, album) {
    return db.songs.get({'album': album, 'name': song})
  },
  // gets the song ID based off the name
  getSongID: async function(song) {
    return db.songs.where('name').equals(song)
  },
  // get all artists in the database
  getAllArtists: async function() {
    return db.songs.orderBy('artist').uniqueKeys()
  },
  getAllAlbums: async function() {
    return db.songs.orderBy('album').uniqueKeys()
  },
  getAllArtistSongs: async function(artist) {
    return db.songs.where('artist').equals(artist).toArray()
  },
  getAllAlbumSongs: async function(album) {
    return db.songs.where('album').equals(album).toArray()
  },
  // get the total amount of time listened to an artist
  getTotalPlayTimeByArtist: async function(artist) {
    // get all songs by that artist
    let artistSongs = await this.getAllArtistSongs(artist)
    // the total number of miliseconds
    let total = 0
    for (let song of artistSongs) {
      // sometimes the song length or play count is undefined
      // if that is the case, just ignore it instead of killing the total
      total += (song.length || 0) * (song.playCount || 0)
    }
    return total
  },
  getTotalPlayTimeByAlbum: async function(album) {
    let albumSongs = await this.getAllAlbumSongs(album)
    let total = 0
    for (let song of albumSongs) {
      total += (song.length || 0) * (song.playCount || 0)
    }
    return total
  },
  // the range an artist has been active
  artistRangeYear: async function(artist) {
    let songs = await db.songs
      .where('artist')
      .equals(artist)
      .filter(e => e.year)
      .sortBy('year')
    return {
      start: songs[0].year,
      end: songs[songs.length - 1].year
    }
  },
  averageArtistRating: async function(artist) {
    let songs = await db.songs
      .where('artist')
      .equals(artist)
      .filter(e => e.rating)
      .toArray()
    let rating = 0
    for (let song of songs) {
      rating += song.rating
    }
    return (rating / songs.length).toPrecision(4)
  },
  averageAlbumRating: async function(album) {
    let songs = await db.songs
      .where('album')
      .equals(album)
      .filter(e => e.rating)
      .toArray()
    let rating = 0
    for (let song of songs) {
      rating += song.rating
    }
    return (rating / songs.length).toPrecision(4)
  },
  getArtistGenre: async function(artist) {
    let songs = await db.songs
      .where('artist')
      .equals(artist)
      .filter(e => e.genre)
      .toArray()
    let genres = {}
    for (let song of songs) {
      if (genres[song.genre]) {
        genres[song.genre] += 1
      } else {
        genres[song.genre] = 1
      }
    }
    // get a sorted array of the most common to least common genre
    let genresArr = parse.sortObjectByValue(genres)
    // return the most common genre
    return genresArr[0]
  },
  // logs a list of songs, length and play counts of an artist for testing
  showArtistSongTimeInfo: async function(artist) {
    let songs = await this.getAllArtistSongs(artist)
    for (let song of songs) {
      console.log({
        name: song.name,
        length: (song.length || 0),
        playCount: (song.playCount || 0)
      })
    }
  },
  // gets the song based off the ID
  getSong: async function(trackID) {
    return db.songs.get(trackID)
  },
  // gets an array of dates and play counts of that song when given the song ID
  getPlayHistory: async function(trackID) {
    let songPlayCounts = await db.playCount
      .where('trackID')
      .equals(trackID)
      .sortBy('date')
    let songArray = {
      date: [],
      playCount: []
    }
    for (let play of songPlayCounts) {
      songArray.playCount.push(play.playCount)
      songArray.date.push(
        moment.unix(play.date).format(timeFormat)
      )
    }
    // return songPlayCounts
    return songArray
  },
  // gets the most recent play count entry for that song
  getMostRecentPlayCount: async function(id) {
    let songPlayCounts = await db.songs.get(id)
    if (songPlayCounts) {
      return songPlayCounts.playCount
    }
    return null
  },
  // get all the songs from the itunes database
  getSongsFromFile: function(fileName) {
    // import the text from the file and convert it from binary data to a string
    const iTunesRawData = fs.readFileSync(fileName).toString('utf-8')
    // eslint-disable-next-line no-undef
    const parser = new DOMParser()
    const parsedData = parser.parseFromString(iTunesRawData, 'text/xml')

    // apple stores the song info several layers deep
    const songArray = parsedData.getElementsByTagName('dict')[0].getElementsByTagName('dict')[0].getElementsByTagName('dict')

    let songs = []
    for (let song of songArray) {
      songs.push(parse.parseSong(song.innerHTML))
    }
    return songs
  },
  // checks to see if it is time to update the database
  timeToUpdate: function(lastRead) {
    // number of hours between sync
    let hours = store.get('hoursSync') || 6
    // number of days between sync
    let days = store.get('daysSync') || 0
    // number of seconds in an hour
    let unixHour = 3600
    // number of seconds in a day
    let unixDay = unixHour * 24
    // the time between each sync
    let syncTime = (unixHour * hours) + (unixDay * days)

    return (lastRead + syncTime)
  },
  getPath: function() {
    // get the path to the source file
    const sourceFile = store.get('sourceFile')

    // if our source file path does not exist
    if (!sourceFile) {
      // let the user pick the file
      let path = dialog.showOpenDialog({properties: ['openFile']})[0]
      // set the path in the database
      store.set('sourceFile', path)
      return path
    }
    // return the path from the database if it exists
    return sourceFile
  },
  // adds the new play count data set to the database
  addPlayCount: function(trackID, playCount, time) {
    return db.playCount.add({
      trackID: trackID,
      date: time,
      playCount: playCount
    })
  },
  logData: async function(songs) {
    const uiLog = document.getElementById('uiLog')
    let artist, songID
    // for each song we have
    for (let song of songs) {
      // if the song is not a podcast
      if (!song['Podcast']) {
        songID = sha1(song['Artist'] + song['Album'] + song['Name'])

        if (song['Artist'] !== artist) {
          uiLog.innerHTML = 'Adding in ' + song['Artist']
        }
        artist = song['Artist']

        // get the most recent play count data for that song before it is overwritten
        let recentPlayCount = await this.getMostRecentPlayCount(songID)

        // overwrite the song data in the database
        db.songs.put({
          id: songID,
          name: song['Name'],
          artist: song['Artist'],
          year: song['Year'],
          // sometimes the play count is undefined, in that case make it 0
          playCount: (song['Play Count'] || 0),
          dateModified: song['Date Modified'],
          dateAdded: song['Date Added'],
          rating: song['Rating'],
          albumRating: song['Album Rating'],
          length: song['Total Time'],
          size: song['Size'],
          trackNumber: song['Track Number'],
          bitRate: song['Bit Rate'],
          // I don't know why, but apple's Play Date is not in unix time
          playDate: moment.utc(song['Play Date UTC']).unix(),
          album: song['Album'],
          genre: song['Genre']
        }).catch(function(error) {
          console.log(error)
        })

        // set our dbSong only if recent data exists
        const currPlayCount = song['Play Count'] ? song['Play Count'] : 0

        // if we dont have any recent data points, add it in
        if (recentPlayCount === null || currPlayCount > recentPlayCount) {
          let convertedTime = moment.utc(song['Play Date UTC']).unix()
          this.addPlayCount(songID, currPlayCount, convertedTime)
        }
      }
    }
  }
}

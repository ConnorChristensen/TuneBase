// import a file reader
const fs = require('fs')
const dexie = require('dexie')
const c3 = require('c3')
const moment = require('moment')
const sha1 = require('sha1')
const timeFormat = 'MM/DD/YY H:mm'

let db

module.exports = {
  init: function() {
    db = new dexie.Dexie('iTunesData')
    db.version(1).stores({
      songs: 'id, [album+name], [album+artist], name, artist, year, dateModified, dateAdded, rating, albumRating, length, size, trackNumber, bitRate, playDate, album, genre',
      playCount: '++id, trackID, date, playCount',
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
    return db.songs.where(name).equals(song)
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
      date: ['date'],
      playCount: ['play count']
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
  getMostRecentPlayCount: async function(trackID) {
    // Search the play count table for that ID, whatever you find, reverse the list and,
    // then sort by date so that the most recent data entry is at position 0
    let songPlayCounts = await db.playCount
        .where('trackID')
        .equals(trackID)
        .reverse()
        .sortBy('date')

    // return that most recent data point
    if (songPlayCounts[0]) {
      return songPlayCounts[0]
    }
    return null
  },
  // get all the songs from the itunes database
  getSongsFromFile: function(fileName) {
    // import the text from the file and convert it from binary data to a string
    const iTunesRawData = fs.readFileSync(fileName).toString('utf-8')

    const parser = new DOMParser();
    const parsedData = parser.parseFromString(iTunesRawData, 'text/xml')

    // apple stores the song info several layers deep
    const songArray = parsedData.getElementsByTagName('dict')[0].getElementsByTagName('dict')[0].getElementsByTagName('dict')

    let songs = []
    for (let song of songArray) {
      songs.push(parseSong(song.innerHTML))
    }
    return songs
  },
  logData: async function(songs) {
    const uiLog = document.getElementById('uiLog')
    let artist, songID
    // for each song we have
    for (let song of songs) {
      songID = sha1(song['Artist']+song['Album']+song['Name'])

      if (song['Artist'] !== artist) {
        uiLog.innerHTML = "Adding in " + song['Artist']
      }
      artist = song['Artist']

      db.songs.put({
        id: songID,
        name: song["Name"],
        artist: song["Artist"],
        year: song["Year"],
        dateModified: song["Date Modified"],
        dateAdded: song["Date Added"],
        rating: song["Rating"],
        albumRating: song["Album Rating"],
        length: song["Total Time"],
        size: song["Size"],
        trackNumber: song["Track Number"],
        bitRate: song["Bit Rate"],
        playDate: song["Play Date"],
        album: song["Album"],
        genre: song["Genre"],
      }).catch(function (error) {
        console.log(error);
      })

      // adds the new play count data set to the database
      function addPlayCount(trackID, playCount) {
        return db.playCount.add({
          trackID: trackID,
          date: moment().unix(),
          playCount: playCount
        })
      }

      // get the most recent play count data for that song
      let recentData = await this.getMostRecentPlayCount(songID)

      // set our dbSong only if recent data exists
      const dbPlayCount = recentData ? recentData.playCount : null
      const currPlayCount = song['Play Count'] ? song['Play Count'] : 0

      // if we dont have any recent data points, add it in
      if (dbPlayCount === null || currPlayCount > dbPlayCount) {
        addPlayCount(songID, currPlayCount)
      }
    }
  }
}

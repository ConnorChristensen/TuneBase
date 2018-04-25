// import a file reader
const fs = require('fs')
const dexie = require('dexie')
const c3 = require('c3')
const moment = require('moment')

const timeFormat = 'MM/DD/YY H:mm'


function getSongsFromFile(fileName) {
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
}

function timeToUpdate(lastRead) {
  let currentTime = moment().unix()

  // number of hours between sync
  let hours = 1
  // number of days between sync
  let days = 0
  // number of seconds in an hour
  let unixHour = 3600
  // number of seconds in a day
  let unixDay = unixHour*24
  // the time between each sync
  let syncTime = (unixHour*hours) + (unixDay*days)

  // is our current time bigger than the time we need to sync?
  return currentTime >= (lastRead + syncTime)
}

// dexie.delete('iTunesData');

let db = new dexie.Dexie('iTunesData')
db.version(1).stores({
  songs: 'id, name, artist, year, dateModified, dateAdded, bitRate, playDate, album, genre',
  playCount: '++id, trackID, date, playCount',
  lastRead: 'id, date',
})

let songs = getSongsFromFile('iTunes Library.xml')

// decide whether we need to load new info and update the songs database
;(async function() {

  // get the last read time of the file
  let lastRead = await db.lastRead.get(0)

  // if it is time to update the data set
  if (timeToUpdate(lastRead.date)) {
    console.log("it is time to update the database");
    // store the current time in the database
    db.lastRead.put({id: 0, date: moment().unix()})
  }
})()

async function getSongID(song) {
  return db.songs.where(name).equals(song)
}

// an asynchronous function that will return the
// song with that trackID
async function getSong(trackID) {
  return db.songs.get(trackID)
}

async function getPlayHistory(trackID) {
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
      moment(play.date).format(timeFormat)
    )
  }
  // return songPlayCounts
  return songArray
}

// an asynchronous function that will return the
// most recent entry for that song
async function getMostRecentPlayCount(trackID) {
  /*
    Search the play count table for that ID,
    whatever you find, reverse the list and,
    then sort by date so that the most recent
    data entry is at position 0
  */
  let songPlayCounts = await db.playCount
      .where('trackID')
      .equals(trackID)
      .reverse()
      .sortBy('date')

  // return that most recent data point
  return songPlayCounts[0]
}

function datesMatch(date, now) {
  if (date.getDate()  !== now.getDate() ||
      date.getYear()  !== now.getYear() ||
      date.getMonth() !== now.getMonth()) {
    return true
  }
  return false
}

async function logData() {
  // for each song we have
  for (let song of songs) {
    // check to see if it exists in the database
    let songExists = await getSong(song['Track ID'])
    // if it does not, then add it
    if (!songExists) {
      db.songs.add({
        id: song['Track ID'],
        name: song["Name"],
        artist: song["Artist"],
        year: song["Year"],
        dateModified: song["Date Modified"],
        dateAdded: song['Date Added'],
        bitRate: song['Bit Rate'],
        playDate: song['Play date'],
        album: song['Album'],
        genre: song['Genre']
      }).catch(function (error) {
        console.log(error);
      })
    }

    // adds the new play count data set to the database
    function addPlayCount(trackID, playCount) {
      return db.playCount.add({
        trackID: trackID,
        date: new Date().getTime(),
        playCount: playCount
      })
    }

    // get the most recent play count data for that song
    let recentData = await getMostRecentPlayCount(song['Track ID'])
    // if that song does not exist, add it in
    if (!recentData) {
      addPlayCount(song['Track ID'], song['Play Count'])
      .catch(function (error) {
        console.log(error);
      })
    } else {
      // only log it if the play count has changed
      if (recentData.playCount !== song['Play Count']) {
        // if the song does exist, get the current date
        let date = new Date(recentData.date)
        // if the song element date is not the same date as today,
        // add the new data
        if (datesMatch(date, new Date())) {
          addPlayCount(song['Track ID'], song['Play Count'])
            .catch(function (error) {
            console.log(error);
          })
        }
      }
    }
  }
}

logData()

// create an option object to append to a selection
function createOption(value, text) {
  // create a new option element
  let option = document.createElement('option')
  // set the value of the option
  option.value = value
  // set the text the user sees
  option.innerHTML = text
  return option
}

// this is a tree that will hold all the artists, albums and songs
let songTree = {}

// when the DOM loads
document.addEventListener('DOMContentLoaded', function(event) {

  // get our artist element
  let artistSelect = document.getElementById('artist')

  // shorthand variables
  let artist = ""
  let album = ""

  for (let song of songs) {
    // shorthand variables
    artist = song.Artist
    album = song.Album

    // if the tree does not have that artist
    if (!songTree.hasOwnProperty(artist)) {
      // create an artist object for albums
      songTree[artist] = {}
    }

    // if the tree does not have that album
    if (!songTree[artist].hasOwnProperty(album)) {
      // create a song array
      songTree[artist][album] = []
    }

    // add the song to the album array in the artist object
    songTree[artist][album].push(song.Name)
  }

  // for every artist in the song tree
  for (let artistKey in songTree) {
    artistSelect.appendChild(createOption(artistKey, artistKey))
  }
})

// a global artist value so the update songs function knows what
// artist to look under
let selectedArtist = ''
let selectedAlbum = ''

// removes all the options from a selection tag
function removeOptions(selectbox) {
  for(let i = selectbox.options.length - 1 ; i >= 0 ; i--) {
    selectbox.remove(i);
  }
}

// updates the albums select to the albums made by that artist
function updateAlbums(artist) {
  // when you change the artist, clear out the album and song fields
  removeOptions(document.getElementById('album'))
  removeOptions(document.getElementById('song'))

  // get the album tag
  let albumSelect = document.getElementById('album')
  // set our global artist for the updateSongs function
  selectedArtist = artist

  // update the song list with the value of the first album
  let album = Object.keys(songTree[artist])[0]
  selectedAlbum = album
  updateSongs(album)

  // for each album
  for (let albumKey in songTree[artist]) {
    albumSelect.appendChild(createOption(albumKey, albumKey))
  }
}

// updates the songs select to the songs in that album
function updateSongs(album) {
  // remove all the songs in the song selection
  removeOptions(document.getElementById('song'))
  let songSelect = document.getElementById('song')
  selectedAlbum = album

  loadSongData(songTree[selectedArtist][album][0])

  for (let song of songTree[selectedArtist][album]) {
    songSelect.appendChild(createOption(song, song))
  }
}

function loadSongData(song) {
  let chart
  // look through the song database and get an array of the play counts with dates
  db.songs.get({album: selectedAlbum, name: song}, songResponse => {
      return getPlayHistory(songResponse.id)
    }).then(function(e) {
      chart = c3.generate({
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
      });
    })
}

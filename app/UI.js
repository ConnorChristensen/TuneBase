// create a dialog
const { dialog } = require('electron').remote

// checks to see if it is time to update the database
function timeToUpdate(lastRead) {
  let currentTime = moment().unix()

  // number of hours between sync
  let hours = 6
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

// this is the array of songs
let songs

// this is a tree that will hold all the artists, albums and songs
let songTree = {}

/*****************************************************
*********** MAIN FUNCTION START OF PROGRAM ***********
*****************************************************/
;(async function() {

  // get the last read time of the file
  let lastRead = await db.lastRead.get(0)

  const sourceFile = await db.sourceFile.get(0)

  let path = ''
  // if our source file path does not exist
  if (!sourceFile || !sourceFile.filePath) {
    // let the user pick the file
    path = dialog.showOpenDialog({properties: ['openFile']})[0]
    // set the path in the database
    db.sourceFile.put({id: 0, filePath: path})
  } else {
    path = sourceFile.filePath
  }

  // if it is time to update the data set
  if (!lastRead || timeToUpdate(lastRead.date)) {
    document.getElementById('loadingIcon').style.display = 'block'
    // parse the file and get the songs
    songs = getSongsFromFile(path)
    // store the current time in the database
    db.lastRead.put({id: 0, date: moment().unix()})
    // log data runs async, but we want it to be done before we continue
    await logData(songs)
  }
  songs = await db.songs.toArray()
  document.getElementById('loadingIcon').style.display = 'none'
  loadSelectionFields()
})()


/******************************
*********** UI CODE ***********
*******************************/

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

// create our song tree and load the artists into the selection
function loadSelectionFields() {
  // get our artist element
  let artistSelect = document.getElementById('artist')

  // shorthand variables
  let artist = ""
  let album = ""

  for (let song of songs) {
    // shorthand variables
    artist = song.artist
    album = song.album

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
    songTree[artist][album].push(song.name)
  }

  let sortedArtistArray = []
  // for every artist in the song tree add the artist to an array
  for (let artistKey in songTree) {
    sortedArtistArray.push(artistKey)
  }

  sortedArtistArray.sort()

  for (let artist of sortedArtistArray) {
    artistSelect.appendChild(createOption(artist, artist))
  }
}

/*********************************
*********** UI UPDATES ***********
**********************************/

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

  // get the album tag
  let albumSelect = document.getElementById('album')
  // set our global artist for the updateSongs function
  selectedArtist = artist

  // update the song list with the value of the first album
  let album = Object.keys(songTree[artist])[0]
  selectedAlbum = album

  // for each album
  for (let albumKey in songTree[artist]) {
    albumSelect.appendChild(createOption(albumKey, albumKey))
  }

  loadAlbumData(album)
}

// updates the songs select to the songs in that album
function updateSongs(album) {
  // remove all the songs in the song selection
  removeOptions(document.getElementById('song'))
  let songSelect = document.getElementById('song')
  selectedAlbum = album

  for (let song of songTree[selectedArtist][album]) {
    songSelect.appendChild(createOption(song, song))
  }

  loadAlbumData(album)
}

// load a graph with all songs on the album by that artist
async function loadAlbumData(album) {
  // get all songs on that album made by that artist
  let albumSongs = await db.songs.where(['album', 'artist']).equals([album, selectedArtist]).toArray()
  // init our chart data
  let chartData = {
    xs: {},
    columns: []
  }
  // for every song in that album by that artist
  for (let song of albumSongs) {
    // get the play history of that song
    let history = await getPlayHistory(song.id)
    // remove the "date" and "play count" strings in the arrays
    history.date.splice(0,1)
    history.playCount.splice(0,1)
    // set our play count data to have the name of the song
    let playCountData = [song.name]
    // set our time data to have the name of the song and " Time"
    let timeData = [song.name + " Time"]
    // add in our data, a column with our play count and time
    chartData.columns.push(playCountData.concat(history.playCount))
    chartData.columns.push(timeData.concat(history.date))
    // bind the play count and time arrays together in c3
    chartData.xs[song.name] = song.name + " Time"
  }
  let chart = c3.generate({
    bindto: '#chart',
    data: {
      xs: chartData.xs,
      xFormat: '%m/%d/%Y %H:%M',
      columns: chartData.columns,
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

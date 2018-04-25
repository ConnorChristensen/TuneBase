// checks to see if it is time to update the database
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

let songs = getSongsFromFile('iTunes Library.xml')

// decide whether we need to load new info and update the songs database
;(async function() {

  // get the last read time of the file
  let lastRead = await db.lastRead.get(0)

  // if it is time to update the data set
  if (!lastRead || timeToUpdate(lastRead.date)) {
    console.log("It is time to update the database");
    // store the current time in the database
    db.lastRead.put({id: 0, date: moment().unix()})
    logData(songs)
  }
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

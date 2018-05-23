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

async function setPath() {
  // get the path to the source file
  const sourceFile = await db.sourceFile.get(0)

  // if our source file path does not exist
  if (!sourceFile || !sourceFile.filePath) {
    // let the user pick the file
    let path = dialog.showOpenDialog({properties: ['openFile']})[0]
    // set the path in the database
    db.sourceFile.put({id: 0, filePath: path})
    return path
  }
  // return the path from the database if it exists
  return sourceFile.filePath
}

// the vue object
let app

/*****************************************************
*********** MAIN FUNCTION START OF PROGRAM ***********
*****************************************************/
;(async function() {

  // get the last read time of the file
  let lastRead = await db.lastRead.get(0)

  // the raw info where we will store our song info
  let songs = []

  // if it is time to update the data set
  if (!lastRead || timeToUpdate(lastRead.date)) {
    // show the loading icon
    document.getElementById('loadingIcon').style.display = 'block'
    // parse the file and get the songs
    songs = getSongsFromFile(getPath())
    // store the current time in the database as the time last read
    db.lastRead.put({id: 0, date: moment().unix()})
    // log data runs async, but we want it to be done before we continue
    await logData(songs)
  }
  // get all songs from the db, and overwrite the songs from the read in file
  // the read in file has slightly different key values from what is in the database
  songs = await db.songs.toArray()
  // hide the loading icon
  document.getElementById('loadingIcon').style.display = 'none'

  let tree = buildSongTree(songs)
  let artists = buildArtistsArray(tree)

  // create our vue instance
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
        song: '',
      }
    },
    watch: {
      'selected.artist': function() {
        // clear all albums
        this.albums = []
        // for every album under the artist
        for (let albumKey in this.tree[this.selected.artist]) {
          // add that album to our array
          this.albums.push(albumKey)
        }
      },
      'selected.album': async function() {
        // get all songs on that album made by that artist
        let albumSongs = await db.songs.where(['album', 'artist'])
                          .equals([this.selected.album, this.selected.artist]).toArray()

        // clear all songs
        this.songs = []
        // push all song names into the songs array
        for (let song of albumSongs) {
          this.songs.push(song.name)
        }

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
        db.songs.get({album: this.selected.album, name: this.selected.song}, songResponse => {
          return getPlayHistory(songResponse.id)
        }).then(function(e) {
          //deep copy the array
          let values = e.playCount.slice()
          values.splice(0,1)
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
          });
        })
      }
    }
  })
})()

function buildSongTree(songs) {
  // get our artist element
  let artistSelect = document.getElementById('artist')

  // shorthand variables
  let artist = ""
  let album = ""
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

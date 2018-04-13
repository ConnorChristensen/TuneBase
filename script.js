// import a file reader
const fs = require('fs')
const dexie = require('dexie')

// import the text from the file and convert it from binary data to a string
const iTunesRawData = fs.readFileSync('sample.xml').toString('utf-8')

const parser = new DOMParser();
const parsedData = parser.parseFromString(iTunesRawData, 'text/xml')

// apple stores the song info several layers deep
const songArray = parsedData.getElementsByTagName('dict')[0].getElementsByTagName('dict')[0].getElementsByTagName('dict')

let songs = []

for (let x = 0; x < songArray.length; x+= 1) {
  songs.push(parseSong(songArray[x].innerHTML))
}

let db = new dexie.Dexie('iTunesData')
db.version(1).stores({
  songs: 'id, name, artist, year, dateModified, dateAdded, bitRate, playDate, album, genre',
  playCount: '++id, trackID, date, playCount'
})

// an asynchronous function that will return the
// song with that trackID
async function getSong(trackID) {
  return db.songs.get(trackID)
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

// when the DOM loads
document.addEventListener('DOMContentLoaded', function(event) {

  // get our artist field
  let artistSelect = document.getElementById('artist')
  let songSelect = document.getElementById('song')

  // for each song
  songs.forEach(function (song) {
    // create a new option element
    let artistOption = document.createElement('option')
    // set the value and content to the artist
    artistOption.value = song.Artist
    artistOption.innerHTML = song.Artist
    // append the new option to the artist select tag
    artistSelect.appendChild(artistOption)

    let songOption = document.createElement('option')
    songOption.value = song.Name
    songOption.innerHTML = song.Name
    songSelect.appendChild(songOption)
  })
})

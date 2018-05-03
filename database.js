// import a file reader
const fs = require('fs')
const dexie = require('dexie')
const c3 = require('c3')
const moment = require('moment')
const timeFormat = 'MM/DD/YY H:mm'


// dexie.delete('iTunesData');
/******************************************
*********** CREATE THE DATABASE ***********
******************************************/

let db = new dexie.Dexie('iTunesData')
db.version(1).stores({
  songs: 'id, name, artist, year, dateModified, dateAdded, bitRate, playDate, album, genre',
  playCount: '++id, trackID, date, playCount',
  lastRead: 'id, date',
})


/************************************************
*********** DATABASE HELPER FUNCTIONS ***********
************************************************/

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
  // Search the play count table for that ID, whatever you find, reverse the list and,
  // then sort by date so that the most recent data entry is at position 0
  let songPlayCounts = await db.playCount
      .where('trackID')
      .equals(trackID)
      .reverse()
      .sortBy('date')

  // return that most recent data point
  return songPlayCounts[0]
}



// get all the songs from the itunes database
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

/***************************************************
*********** LOG NEW DATA IN THE DATABASE ***********
****************************************************/
async function logData(songs) {
  // for each song we have
  for (let song of songs) {
    // check to see if it exists in the database
    let songExists = await getSong(song['Track ID'])
    // if the song does not exist, then add it
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
        date: moment().unix(),
        playCount: playCount
      })
    }

    // get the most recent play count data for that song
    let recentData = await getMostRecentPlayCount(song['Track ID'])
    // if that song does not exist and the play count has changed, add it
    if ( !(recentData || recentData.playCount === song['Play Count']) ) {
      addPlayCount(song['Track ID'], song['Play Count'])
      .catch(function (error) {
        console.log(error);
      })
    }
  }
}

// import a file reader
const fs = require('fs')
const dexie = require('dexie')
const c3 = require('c3')
const moment = require('moment')
const sha1 = require('sha1')
const timeFormat = 'MM/DD/YY H:mm'


// dexie.delete('iTunesData');
/******************************************
*********** CREATE THE DATABASE ***********
******************************************/

let db = new dexie.Dexie('iTunesData')
db.version(1).stores({
  songs: 'id, [album+name], [album+artist], name, artist, year, dateModified, dateAdded, bitRate, playDate, album, genre',
  playCount: '++id, trackID, date, playCount',
  lastRead: 'id, date',
  sourceFile: 'id, filePath',
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
      moment.unix(play.date).format(timeFormat)
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
  if (songPlayCounts[0]) {
    return songPlayCounts[0]
  }
  return null
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
  const uiLog = document.getElementById('uiLog')
  let artist, songID
  // for each song we have
  for (let song of songs) {
    songID = sha1(song['Artist']+song['Album']+song['Name'])

    // check to see if it exists in the database
    let dbSong = await getSong(songID)

    if (song['Artist'] !== artist) {
      uiLog.innerHTML = "Adding in " + song['Artist']
    }
    artist = song['Artist']

    // if the song does not exist, then add it
    if (!dbSong) {
      db.songs.add({
        id: songID,
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
    let recentData = await getMostRecentPlayCount(songID)
    // if that song does not exist or the play count has changed, add it
    if (recentData === null || recentData.playCount !== song['Play Count']) {
      // if the play count is defined, add it in
      if (song['Play Count'] != undefined) {
        addPlayCount(songID, song['Play Count'])
        .catch(function (error) {
          console.log(error);
        })
      //otherwise, the play count is 0
      } else {
        addPlayCount(songID, 0)
        .catch(function (error) {
          console.log(error);
        })
      }
    }
  }
}

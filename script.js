// import a file reader
const fs = require('fs')

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
console.log(songs);

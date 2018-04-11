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

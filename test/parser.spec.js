const chai = require('chai')
const parser = require('../app/utils/parser.js')

chai.should()

const song = `
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>Major Version</key><integer>1</integer>
	<key>Minor Version</key><integer>1</integer>
	<key>Application Version</key><string>12.9.4.94</string>
	<key>Date</key><date>2019-04-05T17:38:30Z</date>
	<key>Features</key><integer>5</integer>
	<key>Show Content Ratings</key><true/>
	<key>Library Persistent ID</key><string>940F28C6D3C6D3BE</string>
	<key>Tracks</key>
	<dict>
		<key>1327</key>
    <dict>
			<key>Track ID</key><integer>8743</integer>
			<key>Size</key><integer>40106348</integer>
			<key>Total Time</key><integer>227360</integer>
			<key>Disc Number</key><integer>1</integer>
			<key>Disc Count</key><integer>1</integer>
			<key>Track Number</key><integer>5</integer>
			<key>Track Count</key><integer>13</integer>
			<key>Year</key><integer>2002</integer>
			<key>Date Modified</key><date>2017-03-20T01:48:35Z</date>
			<key>Date Added</key><date>2017-03-20T00:48:49Z</date>
			<key>Bit Rate</key><integer>1411</integer>
			<key>Sample Rate</key><integer>44100</integer>
			<key>Play Count</key><integer>470</integer>
			<key>Play Date</key><integer>3636492678</integer>
			<key>Play Date UTC</key><date>2019-03-27T07:51:18Z</date>
			<key>Skip Count</key><integer>10</integer>
			<key>Skip Date</key><date>2018-12-08T00:24:43Z</date>
			<key>Rating</key><integer>100</integer>
			<key>Album Rating</key><integer>100</integer>
			<key>Album Rating Computed</key><true/>
			<key>Persistent ID</key><string>10CD0079F41CC5A3</string>
			<key>Track Type</key><string>File</string>
			<key>File Folder Count</key><integer>5</integer>
			<key>Library Folder Count</key><integer>1</integer>
			<key>Name</key><string>Lost Cause</string>
			<key>Artist</key><string>Beck</string>
			<key>Album Artist</key><string>Beck</string>
			<key>Album</key><string>Sea Change</string>
			<key>Composer</key><string>Beck</string>
			<key>Genre</key><string>Folk</string>
			<key>Kind</key><string>WAV audio file</string>
			<key>Location</key><string>file:///Users/connorchristensen/Music/Smaller%20iTunes/iTunes%20Media/Music/Beck/Sea%20Change/05%20Lost%20Cause.wav</string>
		</dict>
  </dict>
</plist>
`

const result = {
  'Major Version':         { type: 'number', value: 1 },
  'Minor Version':         { type: 'number', value: 1 },
  'Application Version':   { type: 'string', value: '12.9.4.94' },
  'Date':                  { type: 'date',   value: '2019-04-05T17:38:30.000Z' },
  'Features':              { type: 'number', value: 5 },
  'Show Content Ratings':  { type: 'boolean',value: true },
  'Library Persistent ID': { type: 'string', value: '940F28C6D3C6D3BE' },
  'Track ID':              { type: 'number', value: 8743 },
  'Size':                  { type: 'number', value: 40106348 },
  'Total Time':            { type: 'number', value: 227360 },
  'Disc Number':           { type: 'number', value: 1 },
  'Disc Count':            { type: 'number', value: 1 },
  'Track Number':          { type: 'number', value: 5 },
  'Track Count':           { type: 'number', value: 13 },
  'Year':                  { type: 'number', value: 2002 },
  'Date Modified':         { type: 'date',   value: '2017-03-20T01:48:35.000Z' },
  'Date Added':            { type: 'date',   value: '2017-03-20T00:48:49.000Z' },
  'Bit Rate':              { type: 'number', value: 1411 },
  'Sample Rate':           { type: 'number', value: 44100 },
  'Play Count':            { type: 'number', value: 470 },
  'Play Date':             { type: 'number', value: 3636492678 },
  'Play Date UTC':         { type: 'date',   value: '2019-03-27T07:51:18.000Z' },
  'Skip Count':            { type: 'number', value: 10 },
  'Skip Date':             { type: 'date',   value: '2018-12-08T00:24:43.000Z' },
  'Rating':                { type: 'number', value: 100 },
  'Album Rating':          { type: 'number', value: 100 },
  'Album Rating Computed': { type: 'boolean',value: true },
  'Persistent ID':         { type: 'string', value: '10CD0079F41CC5A3' },
  'Track Type':            { type: 'string', value: 'File' },
  'File Folder Count':     { type: 'number', value: 5 },
  'Library Folder Count':  { type: 'number', value: 1 },
  'Name':                  { type: 'string', value: 'Lost Cause' },
  'Artist':                { type: 'string', value: 'Beck' },
  'Album Artist':          { type: 'string', value: 'Beck' },
  'Album':                 { type: 'string', value: 'Sea Change' },
  'Composer':              { type: 'string', value: 'Beck' },
  'Genre':                 { type: 'string', value: 'Folk' },
  'Kind':                  { type: 'string', value: 'WAV audio file' },
  'Location': {
    type: 'string',
    value: 'file:UsersconnorchristensenMusicSmaller%20iTunesiTunes%20MediaMusicBeckSea%20Change05%20Lost%20Cause.wav'
  }
}

describe('parser module', function() {
  describe('parse song', function() {

    // our parsed song object
    const parsedSong = parser.parseSong(song)

    // two variables for comparing the expected time and parsed time
    let expectedTime

    for (let key in result) {
      it(`should return ${key} of type ${result[key].type}`, function() {

        // check the type
        parsedSong[key].should.be.a(result[key].type)

        // if it is a date
        if (result[key].type === 'date') {
          expectedTime = new Date(result[key].value).getTime()
          // compare that the times match up
          parsedSong[key].getTime().should.equal(expectedTime)
        } else {
          // check the value is what we expect
          parsedSong[key].should.equal(result[key].value)
        }
      })
    }
  })
})
let db = require('../utils/database.js')
let fs = require('fs')

const Store = require('electron-store')
const store = new Store()

function createDBObject(db) {
  return db.transaction('r', db.tables, () => {
    return Promise.all(
      db.tables.map(table => table.toArray()
        .then(rows => ({table: table.name, rows: rows}))
      )
    )
  })
}

const { dialog } = require('electron').remote

// eslint-disable-next-line
let app = new Vue({
  el: '#app',
  data: {
    hours: 0,
    days: 0
  },
  beforeMount: function() {
    this.hours = store.get('hoursSync') || 6
    this.days = store.get('daysSync') || 0
  },
  watch: {
    hours: function(value) {
      store.set('hoursSync', value)
    },
    days: function(value) {
      store.set('daysSync', value)
    }
  },
  methods: {
    exportDB: function() {
      db.init()
      // create a single object with the contents of the database
      createDBObject(db.getDB()).then(function(e) {
        // ask the user for a folder where they can store a backup
        let backupLocation = dialog.showOpenDialog({properties: ['openDirectory']})
        // name the backup file backup.json
        backupLocation += '/backup.json'
        // write the the json object to the file
        fs.writeFile(backupLocation, JSON.stringify(e), function(err) {
          // if there is an error, log it
          if (err) { return console.error(err) }
          // let the users know that the data was backed up ok
          dialog.showMessageBox({type: 'info', message: 'The data was backed up'})
        })
      })
    },
    importDB: function() {
      // warn the user
      const ok = dialog.showMessageBox({
        type: 'question',
        message: 'Importing a backup will delete the current database and load the database with the backup info. Do you want to continue?',
        buttons: ['OK', 'Cancel']
      })
      // if they said ok
      if (ok === 0) {
        // start up the database
        db.init()
        // find the location of the backup file
        const backupLocation = dialog.showOpenDialog({properties: ['openFile']})[0]
        // read in the backup file
        const backup = JSON.parse(fs.readFileSync(backupLocation).toString('utf-8'))
        // for every table in the backup file
        backup.map(function(t) {
          // if the table exists
          if (db.tableExists(t.table)) {
            // get the table and clear the contents
            db.getTable(t.table).clear()
              // bulk add the rows to the table
              .then(() => db.getTable(t.table).bulkAdd(t.rows))
          }
        })
        dialog.showMessageBox({type: 'info', message: 'The data was successfully imported'})
      }
    }
  }
})

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

let app = new Vue({
  el: '#app',
  data: {},
  methods: {
    exportDB: function() {
      createDBObject(db).then(function(e) {
        let backupLocation = dialog.showOpenDialog({properties: ['openDirectory']})
        backupLocation += "/backup.json"
        fs.writeFile(backupLocation, JSON.stringify(e), function(err) {
          if (err) {
            return console.error(err)
          }
          dialog.showMessageBox({type: "info", message: "The data was backed up"})
        })
      })
    }
  }
})

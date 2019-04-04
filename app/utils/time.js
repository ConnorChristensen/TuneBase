module.exports = {
  yearMonthDay: function(date) {
    // start with the year
    let timeString = date.getFullYear()
    timeString += '-'

    // add a leading 0 if the month is less than 10
    if ((date.getMonth() + 1) < 10) {
      timeString += '0' + (date.getMonth() + 1)
    } else {
      timeString += (date.getMonth() + 1)
    }

    timeString += '-'

    // add a leading 0 if the day is less than 10
    if (date.getDate() < 10) {
      timeString += '0' + date.getDate()
    } else {
      timeString += date.getDate()
    }

    return timeString
  }
}

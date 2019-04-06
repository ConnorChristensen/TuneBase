const chai = require('chai')
const time = require('../app/utils/time.js')

chai.should()

describe('time module', function() {
  describe('format', function() {
    it('should exist', function() {
      time.format({ date: new Date(), format: '' })
    })
    it('should return a string', function() {
      time.format({date: new Date(), format: '' }).should.be.a('string')
    })

    const jan_7_1995 = new Date('January 7, 1995 03:08:00')

    it('should return a 4 digit year with "yyyy"', function() {
      time.format({
        date: jan_7_1995,
        format: 'yyyy'
      }).should.equal('1995')
    })
    it('should return year/month/day with "yyyy/mm/dd"', function() {
      time.format({
        date: jan_7_1995,
        format: 'yyyy/mm/dd'
      }).should.equal('1995/01/07')
    })
    it('should return hour:minute with "hh:ii"', function() {
      time.format({
        date: jan_7_1995,
        format: 'hh:ii'
      }).should.equal('03:08')
    })

    describe('leading zeros', function() {
      it('month with "mm"', function() {
        time.format({
          date: jan_7_1995,
          format: 'mm'
        }).should.equal('01')
      })
      it('day with "dd"', function() {
        time.format({
          date: jan_7_1995,
          format: 'dd'
        }).should.equal('07')
      })
      it('minute with "ii"', function() {
        time.format({
          date: jan_7_1995,
          format: 'ii'
        }).should.equal('08')
      })
      it('minute with "ii"', function() {
        time.format({
          date: jan_7_1995,
          format: 'ii'
        }).should.equal('08')
      })
      it('hour with "hh"', function() {
        time.format({
          date: jan_7_1995,
          format: 'hh'
        }).should.equal('03')
      })
    })

    const dec_15_2018 = new Date('December 17, 2018 20:24:00')

    it('should return a 2 digit year with "y"', function() {
      time.format({
        date: dec_15_2018,
        format: 'y'
      }).should.equal('18')
    })
    it('should return a 2 digit year with "yy"', function() {
      time.format({
        date: dec_15_2018,
        format: 'yy'
      }).should.equal('18')
    })
    it('should return a month with "m"', function() {
      time.format({
        date: dec_15_2018,
        format: 'm'
      }).should.equal('12')
    })
    it('should return a day with "d"', function() {
      time.format({
        date: dec_15_2018,
        format: 'd'
      }).should.equal('17')
    })
    it('should return an hour with "h"', function() {
      time.format({
        date: dec_15_2018,
        format: 'h'
      }).should.equal('20')
    })
  })
})

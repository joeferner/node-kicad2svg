'use strict';

var fs = require('fs');
var path = require('path');
var async = require('async');
var kicad2svg = require('..');

module.exports = {
  setUp: function(callback) {
    var self = this;

    fs.readFile(path.join(__dirname, 'discret.mod'), 'utf8', function(err, data) {
      if (err) {
        return callback(err);
      }
      self.deviceModData = data;

      return fs.readFile(path.join(__dirname, 'divers.mod'), 'utf8', function(err, data) {
        if (err) {
          return callback(err);
        }
        self.diversModData = data;
        return callback();
      });
    });
  },

  testParse: function(test) {
    var json = kicad2svg.modParser(this.deviceModData);
    var svg = kicad2svg.modToSvg(json.modules['LM78XX']);

    test.ok(svg.indexOf('svg') > 0);
    test.done();
  },

  testParseUnitsMm: function(test) {
    var json = kicad2svg.modParser(this.diversModData);
    var svg = kicad2svg.modToSvg(json.modules['BUZZER']);

    //console.log(svg);
    test.ok(svg.indexOf('svg') > 0);
    test.done();
  }
};

'use strict';

var fs = require('fs');
var path = require('path');
var async = require('async');
var kicad2svg = require('..');

module.exports = {
  setUp: function(callback) {
    var self = this;

    fs.readFile(path.join(__dirname, 'device.lib'), 'utf8', function(err, data) {
      if (err) {
        return callback(err);
      }
      self.deviceLibData = data;
      return callback();
    });
  },

  testParse: function(test) {
    var json = kicad2svg.libParser(this.deviceLibData);
    var svg = kicad2svg.libToSvg(json.symbols['7SEGM']);

    test.ok(svg.indexOf('svg') > 0);
    test.done();
  }
};

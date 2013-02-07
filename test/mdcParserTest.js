'use strict';

var fs = require('fs');
var path = require('path');
var async = require('async');
var mdcParser = require('..').mdcParser;

var libraryDir = '/usr/share/kicad/modules/';

module.exports = {
  setUp: function(callback) {
    var self = this;

    fs.readFile(path.join(__dirname, 'powerint.mdc'), 'utf8', function(err, data) {
      if (err) {
        return callback(err);
      }
      self.deviceMdcData = data;
      return callback();
    });
  },

  testParse: function(test) {
    var json = mdcParser(this.deviceMdcData);

    //console.log(JSON.stringify(json, null, '  '));
    test.equal(Object.keys(json.symbols).length, 17);
    test.equal(json.symbols['eDIP-12'].description, 'eDIP-12 Flat Package with Heatsink Tab');
    test.done();
  },

  testParseAllMdcs: function(test) {
    if (!fs.existsSync(libraryDir)) {
      console.log("Skipping testParseAllMdcs could not find " + libraryDir);
      return test.done();
    }

    return fs.readdir(libraryDir, function(err, files) {
      if (err) {
        return test.done(err);
      }
      return async.forEachSeries(files, function(file, callback) {
        if (!/\.mdc/.test(file)) {
          return callback();
        }
        var filename = path.join(libraryDir, file);
        return fs.readFile(filename, 'utf8', function(err, data) {
          if (err) {
            console.log(filename);
            return test.done(err);
          }
          try {
            var json = mdcParser(data);
          } catch (ex) {
            console.error(ex);
            test.done(err);
          }
          return callback();
        });
      }, function(err) {
        if (err) {
          return test.done(err);
        }
        return test.done();
      });
    });
  }
};

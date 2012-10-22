'use strict';

var fs = require('fs');
var path = require('path');
var async = require('async');
var libParser = require('..').libParser;

var libraryDir = '/opt/kicad/share/library';

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
    var json = libParser(this.deviceLibData);

    //console.log(JSON.stringify(json.symbols[0], null, '  '));
    test.equal(Object.keys(json.symbols).length, 81);
    test.equal(json.symbols['7SEGM'].draw.length, 13);
    test.done();
  },

  testParseAllLibs: function(test) {
    if (!fs.existsSync(libraryDir)) {
      console.log("Skipping testParseAllLibs could not find " + libraryDir);
      return test.done();
    }

    return fs.readdir(libraryDir, function(err, files) {
      if (err) {
        return test.done(err);
      }
      return async.forEachSeries(files, function(file, callback) {
        if (!/\.lib$/.test(file)) {
          return callback();
        }
        var filename = path.join(libraryDir, file);
        return fs.readFile(filename, 'utf8', function(err, data) {
          if (err) {
            console.log(filename);
            return test.done(err);
          }
          try {
            var json = libParser(data);
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

'use strict';

var fs = require('fs');
var path = require('path');
var async = require('async');
var dcmParser = require('..').dcmParser;

var libraryDir = '/usr/share/kicad/library/';

module.exports = {
  setUp: function(callback) {
    var self = this;

    fs.readFile(path.join(__dirname, 'linear.dcm'), 'utf8', function(err, data) {
      if (err) {
        return callback(err);
      }
      self.deviceDcmData = data;
      return callback();
    });
  },

  testParse: function(test) {
    var json = dcmParser(this.deviceDcmData);

    //console.log(JSON.stringify(json, null, '  '));
    test.equal(Object.keys(json.symbols).length, 43);
    test.equal(json.symbols['CA3130'].description, 'Ampli Op Mos');
    test.equal(json.symbols['CA3130'].keywords.length, 2);
    test.equal(json.symbols['CA3130'].keywords[0], "AmpliOp");
    test.equal(json.symbols['CA3130'].keywords[1], "Mos");
    test.done();
  },

  testParseAllDcms: function(test) {
    if (!fs.existsSync(libraryDir)) {
      console.log("Skipping testParseAllDcms could not find " + libraryDir);
      return test.done();
    }

    return fs.readdir(libraryDir, function(err, files) {
      if (err) {
        return test.done(err);
      }
      return async.forEachSeries(files, function(file, callback) {
        if (!/\.dcm/.test(file)) {
          return callback();
        }
        var filename = path.join(libraryDir, file);
        return fs.readFile(filename, 'utf8', function(err, data) {
          if (err) {
            console.log(filename);
            return test.done(err);
          }
          try {
            var json = dcmParser(data);
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

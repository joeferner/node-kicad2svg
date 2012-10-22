'use strict';

var fs = require('fs');
var path = require('path');
var async = require('async');
var modParser = require('../').modParser;

var moduleDir = '/opt/kicad/share/modules';

module.exports = {
  setUp: function(callback) {
    var self = this;

    fs.readFile(path.join(__dirname, 'discret.mod'), 'utf8', function(err, data) {
      if (err) {
        return callback(err);
      }
      self.discretModData = data;
      return callback();
    });
  },

  testParse: function(test) {
    var json = modParser(this.discretModData);

    //console.log(JSON.stringify(json.modules['C1'], null, '  '));
    test.equal(Object.keys(json.modules).length, 107);
    test.equal(json.modules['C1'].draw.length, 5);
    test.equal(json.modules['C1'].pads.length, 2);
    test.done();
  },

  testParseAllMods: function(test) {
    if (!fs.existsSync(moduleDir)) {
      console.log("Skipping testParseAllMods could not find " + moduleDir);
      return test.done();
    }

    return fs.readdir(moduleDir, function(err, files) {
      if (err) {
        return test.done(err);
      }
      return async.forEachSeries(files, function(file, callback) {
        if (!/\.mod$/.test(file)) {
          return callback();
        }
        var filename = path.join(moduleDir, file);
        return fs.readFile(filename, 'utf8', function(err, data) {
          if (err) {
            console.log(filename);
            return test.done(err);
          }
          try {
            var json = modParser(data);
          } catch (ex) {
            console.error(ex);
            test.done(ex);
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

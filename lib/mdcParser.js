'use strict';

var stringUtils = require('./stringUtils');

module.exports = function(data, opts) {
  opts = opts || {};
  var hasHeader = true;
  if (opts.hasOwnProperty('hasHeader')) {
    hasHeader = opts.hasHeader;
  }

  var results = {
    modules: {}
  };
  data = data.replace(/\r/g, '');
  var lines = data
    .split('\n')
    .map(function(line) { return line.trim(); });
  var i = 0;
  var foundHeaderLine = false;

  for (; i < lines.length; i++) {
    if (/^#(.*?)$/.test(lines[i]) || lines[i] === '') {
      continue;
    }

    if (hasHeader && !foundHeaderLine) {
      parseHeaderLine(results, lines[i]);
      foundHeaderLine = true;
      continue;
    }

    if (/^\$MODULE\s+.*$/.test(lines[i])) {
      var startLine = i;
      for (; i < lines.length && lines[i] !== '$EndMODULE'; i++) {
      }
      i++;
      var symbol = parseModuleDef(lines.slice(startLine, i));
      results.modules[symbol.name] = symbol;
      continue;
    }

    if (lines[i] == '$EndLIBDOC') {
      continue;
    }

    throw new Error('Could not parse file, invalid line: "' + lines[i] + '"');
  }

  return results;
};

function parseHeaderLine(results, line) {
  // todo parse
}

module.exports.parseModuleDef = function(data) {
  return parseModuleDef(data.split('\n').map(function(l) { return l.trim(); }));
};

function parseModuleDef(lines) {
  var i = 0;
  var m;
  var defParts = stringUtils.splitOn(lines[i++], ' \t\n');
  var module = {
    name: defParts[1],
    original: lines.join('\n')
  };

  for (; i < lines.length; i++) {
    if (/^#(.*?)$/.test(lines[i])) {
      continue;
    }

    if (lines[i] == '$EndMODULE') {
      continue;
    }

    if (m = lines[i].match(/^Cd\s+(.*)$/)) {
      module.description = m[1];
      continue;
    }

    if (m = lines[i].match(/^Kw\s+(.*)$/)) {
      module.keywords = m[1].split(' ');
      continue;
    }

    if (m = lines[i].match(/^Li\s+(.*)$/)) {
      module.li = m[1];
      continue;
    }

    throw new Error('Could not parse mdc, invalid line: "' + lines[i] + '"');
  }

  return module;
}

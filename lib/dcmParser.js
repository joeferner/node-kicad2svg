'use strict';

var stringUtils = require('./stringUtils');

module.exports = function(data, opts) {
  opts = opts || {};
  var hasHeader = true;
  if (opts.hasOwnProperty('hasHeader')) {
    hasHeader = opts.hasHeader;
  }

  var results = {
    symbols: {}
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

    if (/^\$CMP\s+.*$/.test(lines[i])) {
      var startLine = i;
      for (; i < lines.length && lines[i] !== '$ENDCMP'; i++) {
      }
      i++;
      var symbol = parseComponentDef(lines.slice(startLine, i));
      results.symbols[symbol.name] = symbol;
      continue;
    }

    throw new Error('Could not parse file, invalid line: "' + lines[i] + '"');
  }

  return results;
};

function parseHeaderLine(results, line) {
  // todo parse
}

module.exports.parseComponentDef = function(data) {
  return parseComponentDef(data.split('\n').map(function(l) { return l.trim(); }));
};

function parseComponentDef(lines) {
  var i = 0;
  var m;
  var defParts = stringUtils.splitOn(lines[i++], ' \t\n');
  var symbol = {
    name: defParts[1],
    original: lines.join('\n')
  };

  for (; i < lines.length; i++) {
    if (/^#(.*?)$/.test(lines[i])) {
      continue;
    }

    if (lines[i] == '$ENDCMP') {
      continue;
    }

    if (m = lines[i].match(/^D\s+(.*)$/)) {
      symbol.description = m[1];
      continue;
    }

    if (m = lines[i].match(/^K\s+(.*)$/)) {
      symbol.keywords = m[1].split(' ');
      continue;
    }

    if (m = lines[i].match(/^F\s+(.*)$/)) {
      symbol.f = m[1];
      continue;
    }

    throw new Error('Could not parse dcm, invalid line: "' + lines[i] + '"');
  }

  return symbol;
}
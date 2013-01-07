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

    if (/^DEF\s+.*$/.test(lines[i])) {
      var startLine = i;
      for (; i < lines.length && lines[i] !== 'ENDDEF'; i++) {
      }
      i++;
      var symbol = parseSymbolDef(lines.slice(startLine, i));
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

module.exports.parseSymbolDef = function(data) {
  return parseSymbolDef(data.split('\n').map(function(l) { return l.trim(); }));
};

function parseSymbolDef(lines) {
  var i = 0;
  var m;
  var startLine;
  var defParts = stringUtils.splitOn(lines[i++], ' \t\n');
  var symbol = {
    name: defParts[1],
    prefix: defParts[2],
    numberOfPins: defParts[3],
    pinNameOffset: parseInt(defParts[4]),
    drawNums: defParts[5] !== 'N',
    drawName: defParts[6] !== 'N',
    unitCount: defParts[7],
    fields: [],
    original: lines.join('\n')
  };

  for (; i < lines.length; i++) {
    if (/^#(.*?)$/.test(lines[i])) {
      continue;
    }

    if (lines[i] === 'ENDDEF') {
      break;
    }

    if (lines[i][0] === 'F') {
      var field = parseFieldLine(lines[i]);
      symbol.fields[field.index] = field;
      continue;
    }

    if (m = lines[i].match(/^ALIAS\s+(.*)$/)) {
      symbol.aliases = symbol.aliases || [];
      symbol.aliases.push(m[1]);
      continue;
    }

    if (lines[i] === 'DRAW') {
      startLine = i;
      for (; i < lines.length && lines[i] !== 'ENDDRAW'; i++) {
      }
      symbol.draw = parseDrawLines(lines.slice(startLine + 1, i));
      continue;
    }

    if (lines[i] === '$FPLIST') {
      startLine = i;
      for (; i < lines.length && lines[i] !== '$ENDFPLIST'; i++) {
      }
      symbol.footprintFilters = parseFootprintFilterLines(lines.slice(startLine + 1, i));
      continue;
    }

    throw new Error('Could not parse symbol def, invalid line: "' + lines[i] + '"');
  }

  return symbol;
}

function parseFootprintFilterLines(lines) {
  return lines;
}

// F0 "S" 0 650 60 H V C CNN
function parseFieldLine(line) {
  var fieldParts = stringUtils.splitOn(line, ' \t\n');
  var text = stringUtils.trim(fieldParts[1], '"');
  var field = {
    index: parseInt(fieldParts[0].substring(1)),
    text: text,
    pos: {
      x: parseFloat(fieldParts[2]),
      y: parseFloat(fieldParts[3])
    },
    size: parseFloat(fieldParts[4]),
    textOrientation: fieldParts[5],
    textVisible: fieldParts[6],
    horizonalJustify: fieldParts[7],
    verticalJustify: fieldParts[8]
  };
  // todo: parse more data
  return field;
}

function parseDrawLines(lines) {
  var results = [];
  for (var i = 0; i < lines.length; i++) {
    if (/^#(.*?)$/.test(lines[i])) {
      continue;
    }

    results.push(parseDrawLine(lines[i]));
  }
  return results;
}

function parseDrawLine(line) {
  var drawParts = stringUtils.splitOn(line, ' \t\n');

  switch (drawParts[0]) {
  case 'S': // Square
    return parseSquareDrawLine(drawParts);

  case 'P': // Polyline
    return parsePolylineDrawLine(drawParts);

  case 'X': // Pin
    return parsePinDrawLine(drawParts);

  case 'C': // Circle
    return parseCircleDrawLine(drawParts);

  case 'A': // Arc
    return parseArcDrawLine(drawParts);

  case 'T': // Text
    return parseTextDrawLine(drawParts);

  default:
    throw new Error("Unhandled draw line type '" + drawParts[0] + "'");
  }
}

function parseSquareDrawLine(drawParts) {
  var sq = {
    type: 'square',
    pos: {
      x: parseFloat(drawParts[1]),
      y: parseFloat(drawParts[2])
    },
    end: {
      x: parseFloat(drawParts[3]),
      y: parseFloat(drawParts[4])
    },
    unit: parseInt(drawParts[5]),
    convert: parseInt(drawParts[6]),
    width: parseFloat(drawParts[7])
  };
  if (drawParts[8] === 'F') {
    sq.fill = 'SHAPE';
  }
  if (drawParts[8] === 'f') {
    sq.fill = 'WITH_BG_BODYCOLOR';
  }
  return sq;
}

function parsePolylineDrawLine(drawParts) {
  var poly = {
    type: 'polyline',
    unit: parseInt(drawParts[2]),
    convert: parseInt(drawParts[3]),
    width: parseFloat(drawParts[4]),
    points: []
  };
  var count = parseInt(drawParts[1]);
  for (var i = 0; i < count; i++) {
    poly.points.push({
      x: parseFloat(drawParts[5 + (i * 2)]),
      y: parseFloat(drawParts[5 + (i * 2) + 1])
    });
  }

  switch (drawParts[5 + (count * 2)]) {
  case 'F':
    poly.fill = 'SHAPE';
    break;
  case 'f':
    poly.fill = 'WITH_BG_BODYCOLOR';
    break;
  }

  return poly;
}

function parsePinDrawLine(drawParts) {
  var pin = {
    type: 'pin',
    name: drawParts[1] === '~' ? '' : drawParts[1],
    number: drawParts[2] === '~' ? '' : drawParts[2],
    pos: {
      x: parseFloat(drawParts[3]),
      y: parseFloat(drawParts[4])
    },
    length: parseFloat(drawParts[5]),
    orientation: drawParts[6],
    numberTextSize: parseFloat(drawParts[7]),
    nameTextSize: parseFloat(drawParts[8]),
    unit: parseInt(drawParts[9]),
    convert: parseInt(drawParts[10]),
    pinType: drawParts[11]
  };
  if (drawParts.length > 12) {
    pin.attributes = drawParts[12];
  }
  return pin;
}

function parseCircleDrawLine(drawParts) {
  var circle = {
    type: 'circle',
    pos: {
      x: parseFloat(drawParts[1]),
      y: parseFloat(drawParts[2])
    },
    radius: parseFloat(drawParts[3]),
    unit: parseInt(drawParts[4]),
    convert: parseInt(drawParts[5]),
    width: parseFloat(drawParts[6])
  };

  switch (drawParts[7]) {
  case 'F':
    circle.fill = 'SHAPE';
    break;
  case 'f':
    circle.fill = 'WITH_BG_BODYCOLOR';
    break;
  }

  return circle;
}

function parseArcDrawLine(drawParts) {
  var arc = {
    type: 'arc',
    pos: {
      x: parseFloat(drawParts[1]),
      y: parseFloat(drawParts[2])
    },
    radius: parseFloat(drawParts[3]),
    t1: parseFloat(drawParts[4]),
    t2: parseFloat(drawParts[5]),
    unit: parseInt(drawParts[6]),
    convert: parseInt(drawParts[7]),
    width: parseFloat(drawParts[8]),
    start: {
      x: parseFloat(drawParts[10]),
      y: parseFloat(drawParts[11])
    },
    end: {
      x: parseFloat(drawParts[12]),
      y: parseFloat(drawParts[13])
    }
  };

  switch (drawParts[9]) {
  case 'F':
    arc.fill = 'SHAPE';
    break;
  case 'f':
    arc.fill = 'WITH_BG_BODYCOLOR';
    break;
  }

  return arc;
}

function parseTextDrawLine(drawParts) {
  var text = {
    type: 'text',
    angle: parseFloat(drawParts[1]),
    pos: {
      x: parseFloat(drawParts[2]),
      y: parseFloat(drawParts[3])
    },
    size: {
      x: parseFloat(drawParts[4])
    },
    attributes: drawParts[5],
    unit: parseInt(drawParts[6]),
    convert: parseInt(drawParts[7]),
    text: drawParts[8],
    thickness: parseInt(drawParts[10]),
    horizonalJustify: drawParts[11],
    verticalJustify: drawParts[12]
  };

  return text;
}
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
  var m;
  var foundHeaderLine = false;
  var currentUnits = 'deci-mils';

  for (; i < lines.length; i++) {
    if (/^#(.*?)$/.test(lines[i]) || lines[i] === '') {
      continue;
    }

    if (hasHeader && !foundHeaderLine) {
      parseHeaderLine(results, lines[i]);
      foundHeaderLine = true;
      continue;
    }

    if (lines[i] === '$EndLIBRARY') {
      break;
    }

    // found in Allegro_HallSensor_Package-CB-PSS_05Jun2012
    if (lines[i] === '$# encoding utf-8') {
      continue;
    }

    if (lines[i] === '$INDEX') {
      for (; i < lines.length && lines[i] !== '$EndINDEX'; i++) {
      }
      continue;
    }

    if (m = lines[i].match(/^Units (.*)$/)) {
      currentUnits = m[1].trim();
      continue;
    }

    if (/^\$MODULE\s+.*$/.test(lines[i])) {
      var startLine = i;
      for (; i < lines.length && !/\$EndMODULE.*/.test(lines[i]); i++) {
      }
      var module = parseModule(lines.slice(startLine, i + 1), {
        units: currentUnits
      });
      results.modules[module.name] = module;
      continue;
    }

    throw new Error('Could not parse file, invalid line: "' + lines[i] + '"');
  }

  return results;
};

function parseHeaderLine(results, line) {
  // todo parse
}

module.exports.parseModule = function(data) {
  return parseModule(data.split('\n').map(function(l) { return l.trim(); }));
};

function parseModule(lines, opts) {
  opts = opts || {};
  opts.units = opts.units || 'deci-mils';

  var i = 0;
  var startLine;
  var m;

  var moduleParts = stringUtils.splitOn(lines[i++], ' \t\n');
  var module = {
    name: moduleParts[1],
    pads: [],
    draw: [],
    original: lines.join('\n'),
    units: opts.units
  };

  for (; i < lines.length; i++) {
    if (/^#(.*?)$/.test(lines[i])) {
      continue;
    }

    if (/\$EndMODULE.*/.test(lines[i])) {
      break;
    }

    if (/^\.LocalClearance.*/.test(lines[i])) {
      // TODO: handle this?
      continue;
    }

    // e.g. "Po 19120 39260 900 0 4E823D06 46EAAFA5 ~~\r\n"
    if (/^Po\s+.*$/.test(lines[i])) {
      var ptLineParts = stringUtils.splitOn(lines[i], ' \t\n');
      var ptLine = {
        pos: {
          x: parseFloat(ptLineParts[1]),
          y: parseFloat(ptLineParts[2])
        },
        orientation: parseInt(ptLineParts[3]),
        layer: parseInt(ptLineParts[4]),
        lastEditTime: parseKicadDate(ptLineParts[5]),
        timestamp: parseKicadDate(ptLineParts[6]),
        bufCar1: ptLineParts[7]
      };
      continue;
    }

    if (m = lines[i].match(/^Li\s+(.*)$/)) {
      module.libraryName = m[1];
      continue;
    }

    if (m = lines[i].match(/^Cd\s+(.*)$/)) {
      module.doc = m[1];
      continue;
    } else if (m = lines[i].match(/^Cd$/)) {
      module.doc = module.libraryName;
      continue;
    }

    if (m = lines[i].match(/^Sc\s+(.*)$/)) {
      module.timestamp = parseKicadDate(m[1]);
      continue;
    }

    if (m = lines[i].match(/^Kw\s+(.*)$/)) {
      module.keywords = stringUtils.splitOn(m[1], ' \t\n');
      continue;
    } else if (m = lines[i].match(/^Kw$/)) {
      module.keywords = [];
      continue;
    }

    if (m = lines[i].match(/^Op\s+(.*)$/)) {
      module.autoPlaceOptions = m[1];
      continue;
    }

    if (m = lines[i].match(/^At\s+(.*)$/)) {
      module.attributes = m[1];
      continue;
    }

    // found in switch-rot.mod
    if (m = lines[i].match(/^RT"$/)) {
      continue;
    }

    if (m = lines[i].match(/^\.SolderPasteRatio\s+(.*)$/)) {
      module.solderPasteRatio = m[1];
      continue;
    }

    if (m = lines[i].match(/^\.SolderMask\s+(.*)$/)) {
      module.solderMask = m[1];
      continue;
    }

    // e.g. "AR /47BA2624/45525076"
    if (m = lines[i].match(/^AR(.*)$/)) {
      module.alternativeReference = m[1].trim();
      continue;
    }

    // e.g. "T1 6940 -16220 350 300 900 60 M I 20 N "CFCARD"\r\n"
    if (m = lines[i].match(/^T(\d+)\s+(.*)$/)) {
      var textParts = stringUtils.splitOn(m[2], ' \t\n');
      var text = {
        pos: {
          x: parseFloat(textParts[0]),
          y: parseFloat(textParts[1])
        },
        size: {
          height: parseFloat(textParts[2]),
          width: parseFloat(textParts[3])
        },
        orientation: parseInt(textParts[4]),
        thickness: parseFloat(textParts[5]),
        bufCar1: textParts[6],
        bufCar2: textParts[7],
        layer: parseInt(textParts[8]),
        value: stringUtils.trim(textParts[10], '"')
      };
      switch (m[1]) {
      case 0:
        module.referenceText = text;
        break;
      case 1:
        module.valueText = text;
        break;
      default:
        module.text = module.text || [];
        module.text.push(text);
        break;
      }
      continue;
    }

    if (/^D.*$/.test(lines[i])) {
      var shape = parseDrawLine(lines[i]);
      if (shape.type == 'polygon') {
        i++;
        for (; i < lines.length && shape.pointCount > 0; i++) {
          shape.points.push(parsePolygonPointLine(lines[i]));
          shape.pointCount--;
        }
        i--; // when we loop it'll increment
        delete shape.pointCount;
      }
      module.draw.push(shape);
      continue;
    }

    if (lines[i] === '$PAD') {
      startLine = i;
      for (; i < lines.length && lines[i] !== '$EndPAD'; i++) {
      }
      module.pads.push(parsePad(lines.slice(startLine + 1, i)));
      continue;
    }

    if (lines[i] === "$SHAPE3D") {
      var startLine = i;
      for (; i < lines.length && lines[i] !== '$EndSHAPE3D'; i++) {
      }
      module.shape3d = parseShape3d(lines.slice(startLine + 1, i - 1));
      continue;
    }

    throw new Error('Could not parse module, invalid line: "' + lines[i] + '"');
  }

  return module;
}

function parseShape3d(lines) {
  var i = 0;
  var shape3d = {
  };

  for (; i < lines.length; i++) {
    var parts = stringUtils.splitOn(lines[i], ' \t\n');

    // file name
    if (parts[0] === 'Na') {
      shape3d.fileName = stringUtils.trim(parts[1], '"\'');
      continue;
    }

    // scale
    if (parts[0] === 'Sc') {
      shape3d.scale = {
        x: parseFloat(parts[1]),
        y: parseFloat(parts[2]),
        z: parseFloat(parts[3])
      };
      continue;
    }

    // offset
    if (parts[0] === 'Of') {
      shape3d.offset = {
        x: parseFloat(parts[1]),
        y: parseFloat(parts[2]),
        z: parseFloat(parts[3])
      };
      continue;
    }

    throw new Error('Could not parse shape 3d, invalid line: "' + lines[i] + '"');
  }

  return shape3d;
}

// $PAD
// Sh "1" C 600 600 0 0 0
// Dr 320 0 0
// At STD N 00E0FFFF
// Ne 0 ""
// Po 1000 0
// $EndPAD
function parsePad(lines) {
  var i = 0;
  var m;
  var pad = {
    parts: []
  };

  for (; i < lines.length; i++) {
    var parts = stringUtils.splitOn(lines[i], ' \t\n');

    if (m = lines[i].match(/^\.SolderPasteRatio\s+(.*)$/)) {
      module.solderPasteRatio = m[1];
      continue;
    }

    // Shape
    if (parts[0] === 'Sh') {
      pad.name = stringUtils.trim(parts[1], '"');
      pad.shape = parts[2];
      pad.size = {
        x: parseFloat(parts[3]),
        y: parseFloat(parts[4])
      };
      pad.deltaSize = {
        x: parseFloat(parts[5]),
        y: parseFloat(parts[6])
      };
      pad.orientation = parseInt(parts[7]);
      continue;
    }

    // Drill
    // e.g. "Dr 350 0 0" or "Dr 0 0 0 O 0 0"
    if (parts[0] === 'Dr') {
      pad.drill = {
        pos: {
          x: parseFloat(parts[1]),
          y: parseFloat(parts[2])
        },
        offset: parseFloat(parts[3]),
        shape: parts[4],
        dx: parseFloat(parts[5]),
        dy: parseFloat(parts[6])
      };
      continue;
    }

    // Attribute
    // e.g. "At SMD N 00888000"
    if (parts[0] === 'At') {
      pad.parts.push({
        type: 'attribute',
        bufLine: parts[1],
        bufCar: parts[2],
        layerMask: parseInt(parts[3], 16)
      });
      continue;
    }

    // Netname
    // e.g. "Ne 461 "V5.0"
    if (parts[0] === 'Ne') {
      pad.parts.push({
        type: 'netname',
        netcode: parseInt(parts[1]),
        name: stringUtils.trim(parts[2], '"')
      });
      continue;
    }

    // Position
    // e.g. "Po 100 200
    if (parts[0] === 'Po') {
      pad.pos = {
        x: parseFloat(parts[1]),
        y: parseFloat(parts[2])
      };
      continue;
    }

    if (m = lines[i].match(/^\.SolderMask\s+(.*)$/)) {
      module.solderMask = m[1];
      continue;
    }

    if (/^\.LocalClearance.*/.test(lines[i])) {
      // TODO: handle this?
      continue;
    }

    throw new Error('Could not parse pad, invalid line: "' + lines[i] + '"');
  }

  return pad;
}

function parseDrawLine(line) {
  var parts = stringUtils.splitOn(line, ' \t\n');

  var shape = null;
  if (parts[0] === 'DC') {
    shape = 'circle';
  } else if (parts[0] === 'DS') {
    shape = 'segment';
  } else if (parts[0] === 'DA') {
    shape = 'arc';
  } else if (parts[0] === 'DP') {
    shape = 'polygon';
  } else {
    throw new Error("parseDrawLine not implemented: " + line);
  }

  switch (shape) {
  case 'circle':
  case 'segment':
    // e.g. "DS -7874 -10630 7874 -10630 50 20\r\n"
    return {
      type: shape,
      start: {
        x: parseFloat(parts[1]),
        y: parseFloat(parts[2])
      },
      end: {
        x: parseFloat(parts[3]),
        y: parseFloat(parts[4])
      },
      width: parseFloat(parts[5]),
      layer: parseInt(parts[6])
    };

  case 'arc':
    return {
      type: shape,
      center: {
        x: parseFloat(parts[1]),
        y: parseFloat(parts[2])
      },
      start: {
        x: parseFloat(parts[3]),
        y: parseFloat(parts[4])
      },
      angle: parseFloat(parts[5]),
      width: parseFloat(parts[6]),
      layer: parseInt(parts[7])
    };

  case 'polygon':
    return {
      type: shape,
      start: {
        x: parseFloat(parts[1]),
        y: parseFloat(parts[2])
      },
      end: {
        x: parseFloat(parts[3]),
        y: parseFloat(parts[4])
      },
      pointCount: parseInt(parts[5]),
      width: parseFloat(parts[6]),
      layer: parseInt(parts[7]),
      points: []
    };

  default:
    throw new Error("parseDrawLine not implemented: " + shape);
  }
}

function parsePolygonPointLine(line) {
  var parts = stringUtils.splitOn(line, ' \t\n');
  if (parts[0] != 'Dl') {
    throw new Error("invalid polygon point: " + line);
  }

  return {
    x: parseFloat(parts[1]),
    y: parseFloat(parts[2])
  };
}

function parseKicadDate(str) {
  var i = parseInt(str, 16);
  if (i === 0) {
    return null;
  }
  return i; // TODO: decode timestamp
}
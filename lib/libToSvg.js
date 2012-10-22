'use strict';

var xmlUtils = require('./xmlUtils');

module.exports = function(symbol, opts) {
  var json = exports.toJson(symbol, opts);
  return xmlUtils.toXml(json);
};

exports.toJson = function(symbol, opts) {
  opts = opts || {};
  var size = opts.size || 500;

  //console.log(JSON.stringify(symbol));
  var drawOpts = {
    symbol: symbol,
    extents: {
      min: {x: 0, y: 0},
      max: {x: 0, y: 0}
    }
  };

  drawOpts.updateExtents = function(x, y) {
    this.extents.min.x = Math.min(this.extents.min.x, x);
    this.extents.min.y = Math.min(this.extents.min.y, y);
    this.extents.max.x = Math.max(this.extents.max.x, x);
    this.extents.max.y = Math.max(this.extents.max.y, y);
  }.bind(drawOpts);

  var data = {
    _name: 'svg',
    _attrs: {
      xmlns: "http://www.w3.org/2000/svg",
      version: "1.1",
      width: size,
      height: size
    },
    _children: [
      {
        _name: 'g',
        _attrs: {
          class: 'viewport',
          transform: 'translate(800, 800)'
        },
        _children: toSvgElements(symbol, drawOpts)
      }
    ]
  };

  var scale = size / (drawOpts.extents.max.x - drawOpts.extents.min.x);
  scale = Math.min(scale, size / (drawOpts.extents.max.y - drawOpts.extents.min.y));
  scale = scale * 0.9;
  data._children[0]._attrs.transform = 'scale(' + scale + ') translate(' + (-drawOpts.extents.min.x + 30) + ', ' + (-drawOpts.extents.min.y + 30) + ')';

  return data;
};

function toSvgElements(symbol, drawOpts) {
  var result = [];
  symbol.draw.forEach(function(draw) {
    var r = drawToSvg(draw, drawOpts);
    result = result.concat(r);
  });

  symbol.fields.forEach(function(field) {
    var r = fieldToSvg(field, drawOpts);
    result = result.concat(r);
  });

  return result;
}

// {"index":1,"text":"C","pos":{"x":50,"y":-100},"size":50,"textOrientation":"H",
//   "textVisible":"V","horizonalJustify":"L","verticalJustify":"CNN"}
function fieldToSvg(field, drawOpts) {
  //console.log(JSON.stringify(field));
  var rotate = 0;
  var x = field.pos.x;
  var y = field.pos.y;
  drawOpts.updateExtents(field.pos.x, field.pos.y);

  var text = field.text;
  if (field.index === 0) {
    text += "?";
  }

  var textAnchor = 'middle';
  switch (field.horizonalJustify) {
  case 'L':
    textAnchor = 'start';
    break;
  case 'R':
    textAnchor = 'end';
    break;
  }

  if (field.textOrientation === 'V') {
    rotate = -90;
    x -= 30;
  }

  return [
    {
      _name: 'text',
      _attrs: {
        x: x,
        y: -y,
        style: "dominant-baseline: central; text-anchor: " + textAnchor + ";",
        'font-size': 55,
        'transform': "rotate(" + rotate + ", " + x + ", " + (-y) + ")"
      },
      _body: text
    }
  ];
}

function drawToSvg(draw, drawOpts) {
  switch (draw.type) {
  case "square":
    return drawSquareToSvg(draw, drawOpts);
  case "polyline":
    return drawPolylineToSvg(draw, drawOpts);
  case "pin":
    return drawPinToSvg(draw, drawOpts);
  case "circle":
    return drawCircleToSvg(draw, drawOpts);
  case "arc":
    return drawArcToSvg(draw, drawOpts);
  case "text":
    return drawTextToSvg(draw, drawOpts);

  default:
    throw new Error("Unsupported draw type '" + draw.type + "'");
  }
}

// {"type": "square", "pos": {"x": -500, "y": 600}, "end": {"x": 550, "y": -600}, "unit": 0, "convert": 1, "width": 0}
function drawSquareToSvg(draw, drawOpts) {
  drawOpts.updateExtents(draw.pos.x, draw.pos.y);
  drawOpts.updateExtents(draw.end.x, draw.end.y);

  return [
    {
      _name: 'rect',
      _attrs: {
        x: Math.min(draw.pos.x, draw.end.x),
        y: -Math.max(draw.pos.y, draw.end.y),
        width: Math.abs(draw.end.x - draw.pos.x),
        height: Math.abs(draw.end.y - draw.pos.y),
        style: "fill-opacity: 0; stroke: rgb(0,0,0); stroke-width: 2;"
      }
    }
  ];
}

// {"type": "polyline", "unit": 0, "convert": 1, "width": 0, "points": [
//   {"x": 0, "y": 0},
//   {"x": 450, "y": 0}
// ]},
function drawPolylineToSvg(draw, drawOpts) {
  //console.log(JSON.stringify(draw));
  var points = [];

  draw.points.forEach(function(pt) {
    drawOpts.updateExtents(pt.x, pt.y);
    points.push(pt.x + "," + -pt.y);
  });

  return [
    {
      _name: 'polyline',
      _attrs: {
        points: points.join(" "),
        fill: draw.fill === "SHAPE" ? "rgb(0,0,0)" : "none",
        style: "stroke: rgb(0,0,0); stroke-width: 2"
      }
    }
  ];
}

// {"type": "pin", "name": "Segm_E", "number": "1", "pos": {"x": -750, "y": -100},
// "length": 250, "orientation": "R", "numberTextSize": 50, "nameTextSize": 50, "unit": 1, "convert": 1, "pinType": "P"},
function drawPinToSvg(draw, drawOpts) {
  //console.log(JSON.stringify(draw));
  var x2 = 0;
  var y2 = 0;
  var numX = 0;
  var numY = 0;
  var nameX = 0;
  var nameY = 0;
  var nameTextAnchor = 'start';
  var nameDominantBaseline = 'auto';
  var numDominantBaseline = 'auto';
  var numRotate = 0;

  switch (draw.orientation) {
  case 'R':
    x2 = draw.pos.x + draw.length;
    y2 = draw.pos.y;
    break;
  case 'L':
    x2 = draw.pos.x - draw.length;
    y2 = draw.pos.y;
    break;
  case 'U':
    x2 = draw.pos.x;
    y2 = draw.pos.y + draw.length;
    break;
  case 'D':
    x2 = draw.pos.x;
    y2 = draw.pos.y - draw.length;
    break;
  default:
    throw new Error("Not Implemented draw orientation: " + draw.orientation);
  }

  if (drawOpts.symbol.pinNameOffset === 0) {
    // pin name is outside
    nameTextAnchor = 'middle';
    numDominantBaseline = 'text-before-edge';
    nameDominantBaseline = 'auto';
    switch (draw.orientation) {
    case 'R':
      nameX = numX = draw.pos.x + (draw.length / 2);
      numY = y2 + 6;
      nameY = y2 + 12;
      break;
    case 'L':
      nameX = numX = draw.pos.x - (draw.length / 2);
      numY = y2 + 6;
      nameY = y2 + 12;
      break;
    case 'U':
      numX = x2 + 6;
      nameX = x2;
      numY = draw.pos.y + (draw.length / 2);
      nameY = y2 + 6;
      break;
    case 'D':
      numX = x2 + 6;
      nameX = x2;
      numY = draw.pos.y - (draw.length / 2);
      nameY = y2 - 6;
      break;
    default:
      throw new Error("Not Implemented draw orientation: " + draw.orientation);
    }
  } else {
    numDominantBaseline = 'auto';
    nameDominantBaseline = 'central';
    switch (draw.orientation) {
    case 'R':
      numX = draw.pos.x + (draw.length / 2);
      nameX = x2 + 6;
      numY = y2 + 6;
      nameY = y2;
      nameTextAnchor = 'start';
      break;
    case 'L':
      numX = draw.pos.x - (draw.length / 2);
      nameX = x2 - 6;
      numY = y2 + 6;
      nameY = y2;
      nameTextAnchor = 'end';
      break;
    case 'U':
      numX = x2 - 6;
      nameX = x2;
      numY = draw.pos.y + (draw.length / 2);
      nameY = y2 + 6;
      numRotate = -90;
      break;
    case 'D':
      numX = x2 - 6;
      nameX = x2;
      numY = draw.pos.y - (draw.length / 2);
      nameY = y2 - 6;
      numRotate = -90;
      break;
    default:
      throw new Error("Not Implemented draw orientation: " + draw.orientation);
    }
  }

  drawOpts.updateExtents(draw.pos.x, draw.pos.y);
  drawOpts.updateExtents(x2, y2);

  var results = [
    {
      _name: 'line',
      _attrs: {
        x1: draw.pos.x,
        y1: -draw.pos.y,
        x2: x2,
        y2: -y2,
        style: "stroke: rgb(0,0,0); stroke-width: 2"
      }
    }
  ];

  if (drawOpts.symbol.drawName) {
    results.push({
      _name: 'text',
      _attrs: {
        x: nameX,
        y: -nameY,
        'dominant-baseline': nameDominantBaseline,
        'text-anchor': nameTextAnchor,
        'font-size': 55
      },
      _body: draw.name
    });
  }

  if (drawOpts.symbol.drawNums) {
    results.push({
      _name: 'text',
      _attrs: {
        x: numX,
        y: -numY,
        'dominant-baseline': numDominantBaseline,
        'text-anchor': 'middle',
        'font-size': 55,
        'transform': "rotate(" + numRotate + ", " + numX + ", " + (-numY) + ")"
      },
      _body: draw.number
    });
  }

  return results;
}

// {"type":"circle","pos":{"x":0,"y":0},"radius":150,"unit":0,"convert":1,"width":6}
function drawCircleToSvg(draw, drawOpts) {
  drawOpts.updateExtents(draw.pos.x - draw.radius, draw.pos.y - draw.radius);
  drawOpts.updateExtents(draw.pos.x + draw.radius, draw.pos.y + draw.radius);

  return [
    {
      _name: 'circle',
      _attrs: {
        cx: draw.pos.x,
        cy: -draw.pos.y,
        r: draw.radius,
        fill: 'none',
        style: "stroke: rgb(0,0,0); stroke-width: 2"
      }
    }
  ];
}

// {"type":"arc",
//    "pos":{"x":4,"y":-2},
//    "radius":162,"t1":1612,"t2":197,"unit":0,"convert":1,"width":0,
//    "start":{"x":-148,"y":50},
//    "end":{"x":157,"y":53}}
//
// {"type":"arc",
//    "pos":{"x":0,"y":-200},
//    "radius":180,"t1":563,"t2":1236,"unit":0,"convert":1,"width":15,
//    "start":{"x":100,"y":-50},
//    "end":{"x":-100,"y":-50}}
function drawArcToSvg(draw, drawOpts) {
  //console.log(JSON.stringify(draw));

  var startX = draw.start.x;
  var startY = -draw.start.y;
  var endX = draw.end.x;
  var endY = -draw.end.y;

  if (startX > endX) {
    var t = startX;
    startX = endX;
    endX = t;

    t = startY;
    startY = endY;
    endY = t;
  }

  drawOpts.updateExtents(startX, startY);
  drawOpts.updateExtents(endX, endY);
  drawOpts.updateExtents(startX - draw.radius, startY - draw.radius);
  drawOpts.updateExtents(startX + draw.radius, startY + draw.radius);
  drawOpts.updateExtents(endX - draw.radius, endY - draw.radius);
  drawOpts.updateExtents(endX + draw.radius, endY + draw.radius);

  var path = "M" + startX + "," + startY + " ";
  path += "a" + draw.radius + "," + draw.radius + " " +
          "0 " +
          "0,1 " +
          (endX - startX) + "," + (endY - startY);

  return [
    {
      _name: 'path',
      _attrs: {
        d: path,
        fill: 'none',
        style: "stroke: rgb(0,0,0); stroke-width: 2"
      }
    }
  ];
}

// {"type":"text","angle":0,"pos":{"x":-50,"y":100},"size":{"x":80},
//   "attributes":"0","unit":0,"convert":0,"thickness":0,"horizonalJustify":"C","verticalJustify":"C"}
function drawTextToSvg(draw, drawOpts) {
  //console.log(JSON.stringify(draw));

  drawOpts.updateExtents(draw.pos.x, draw.pos.y);

  return [
    {
      _name: 'text',
      _attrs: {
        x: draw.pos.x,
        y: -draw.pos.y,
        'text-anchor': 'middle',
        'dominant-baseline': 'central',
        'font-size': 55
      },
      _body: draw.number
    }
  ];
}

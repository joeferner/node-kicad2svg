'use strict';

var xmlUtils = require('./xmlUtils');

module.exports = function(symbol, opts) {
  var json = exports.toJson(symbol, opts);
  return xmlUtils.toXml(json);
};

exports.toJson = function(module, opts) {
  opts = opts || {};
  var size = opts.size || 500;

  //console.log(JSON.stringify(module));
  var drawOpts = {
    module: module,
    extents: {
      min: {x: 0, y: 0},
      max: {x: 0, y: 0}
    },
    pcbColor: "rgb(30,80,30)",
    silkScreenColor: "rgb(240,240,240)",
    drillColor: "rgb(0,0,0)",
    padColor: "rgb(150,150,150)"
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
      height: size,
      style: 'background-color: ' + drawOpts.pcbColor + ';'
    },
    _children: [
      {
        _name: 'g',
        _attrs: {
          class: 'viewport',
          transform: 'translate(800, 800)'
        },
        _children: toSvgElements(module, drawOpts)
      }
    ]
  };

  var scale = size / (drawOpts.extents.max.x - drawOpts.extents.min.x);
  scale = Math.min(scale, size / (drawOpts.extents.max.y - drawOpts.extents.min.y));
  scale = scale * 0.9;
  data._children[0]._attrs.transform = 'scale(' + scale + ') translate(' + (-drawOpts.extents.min.x + 30) + ', ' + (-drawOpts.extents.min.y + 30) + ')';

  return data;
};

function toSvgElements(module, drawOpts) {
  var result = [];

  module.draw.forEach(function(draw) {
    var r = drawToSvg(draw, drawOpts);
    result = result.concat(r);
  });

  module.pads.forEach(function(pad) {
    var r = padToSvg(pad, drawOpts);
    result = result.concat(r);
  });

  return result;
}

function drawToSvg(draw, drawOpts) {
  switch (draw.type) {
  case "segment":
    return drawSegmentToSvg(draw, drawOpts);

  case "circle":
    return drawCircleToSvg(draw, drawOpts);

  default:
    throw new Error("Unsupported draw type '" + draw.type + "'");
  }
}

function drawSegmentToSvg(draw, drawOpts) {
  drawOpts.updateExtents(draw.start.x, draw.start.y);
  drawOpts.updateExtents(draw.end.x, draw.end.y);

  return [
    {
      _name: 'line',
      _attrs: {
        x1: draw.start.x,
        y1: draw.start.y,
        x2: draw.end.x,
        y2: draw.end.y,
        "stroke-linecap": "round",
        style: "stroke: " + drawOpts.silkScreenColor + "; stroke-width: " + draw.width + ";"
      }
    }
  ];
}

function drawCircleToSvg(draw, drawOpts) {
  console.log(JSON.stringify(draw, null, '  '));
  drawOpts.updateExtents(draw.start.x, draw.start.y);
  drawOpts.updateExtents(draw.end.x, draw.end.y);

  return [
    {
      _name: 'circle',
      _attrs: {
        cx: draw.start.x,
        cy: draw.start.y,
        r: draw.end.x,
        fill: "none",
        style: "stroke: " + drawOpts.silkScreenColor + "; stroke-width: " + draw.width + ";"
      }
    }
  ];
}

function padToSvg(pad, drawOpts) {
  var result = [];

  switch (pad.shape) {
  case "C":
    result.push({
      _name: 'circle',
      _attrs: {
        cx: pad.pos.x,
        cy: pad.pos.y,
        r: pad.size.x / 2,
        fill: drawOpts.padColor,
        style: "stroke-width: 1"
      }
    });
    break;

  case "R":
    //console.log(JSON.stringify(pad, null, '  '));
    result.push({
      _name: 'rect',
      _attrs: {
        x: pad.pos.x - (pad.size.x / 2),
        y: pad.pos.y - (pad.size.y / 2),
        width: pad.size.x,
        height: pad.size.y,
        fill: 'rgb(0,0,0)',
        style: "stroke-width: 1"
      }
    });
    break;

  default:
    throw new Error("Unsupported pad shape '" + pad.shape + "'");
  }

  if (pad.drill) {
    result = result.concat(padDrillToSvg(pad, drawOpts));
  }

  pad.parts.forEach(function(part) {
    var r = padPartToSvg(part, drawOpts);
    result = result.concat(r);
  });

  return result;
}

function padPartToSvg(padPart, drawOpts) {
  switch (padPart.type) {
  case "attribute":
  case "netname":
    break;

  default:
    throw new Error("Unsupported pad part type '" + padPart.type + "'");
  }
}

function padDrillToSvg(pad, drawOpts) {
  var radius = pad.drill.pos.x / 2;

  drawOpts.updateExtents(pad.pos.x - radius, pad.pos.y - radius);
  drawOpts.updateExtents(pad.pos.x + radius, pad.pos.y + radius);

  return [
    {
      _name: 'circle',
      _attrs: {
        cx: pad.pos.x,
        cy: pad.pos.y,
        r: radius,
        style: "fill: " + drawOpts.drillColor + "; stroke-width: 1"
      }
    }
  ];
}

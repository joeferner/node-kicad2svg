'use strict';

// Convert an elliptical arc based around a central point
//  to an elliptical arc parameterized for SVG.
//
// Input is a list containing:
//    cx - center x coordinate
//    cy - center y coordinate
//    rx - x-radius of ellipse
//    ry - y-radius of ellipse
//    theta1 - beginning angle of arc in degrees
//    delta - arc extent in degrees
//    phi - x-axis rotation angle in degrees
//
// Output is a list containing:
//    x-coordinate of beginning of arc
//    y-coordinate of beginning of arc
//    x-radius of ellipse
//    y-radius of ellipse
//    large-arc-flag as defined in SVG specification
//    sweep-flag  as defined in SVG specification
//    x-coordinate of endpoint of arc
//    y-coordinate of endpoint of arc
var convertToSvg = exports.convertCenterArcToSvg = function(opts) {
  opts.theta2 = opts.delta + opts.theta1;
  opts.theta1 = deg2rad(opts.theta1);
  opts.theta2 = deg2rad(opts.theta2);
  var phiR = deg2rad(opts.phi);

  //Figure out the coordinates of the beginning and ending points
  var x0 = opts.cx + Math.cos(phiR) * opts.rx * Math.cos(opts.theta1) +
           Math.sin(-phiR) * opts.ry * Math.sin(opts.theta1);
  var y0 = opts.cy + Math.sin(phiR) * opts.rx * Math.cos(opts.theta1) +
           Math.cos(phiR) * opts.ry * Math.sin(opts.theta1);

  var x1 = opts.cx + Math.cos(phiR) * opts.rx * Math.cos(opts.theta2) +
           Math.sin(-phiR) * opts.ry * Math.sin(opts.theta2);
  var y1 = opts.cy + Math.sin(phiR) * opts.rx * Math.cos(opts.theta2) +
           Math.cos(phiR) * opts.ry * Math.sin(opts.theta2);

  var largeArc = (opts.delta > 180) ? 1 : 0;
  var sweep = (opts.delta > 0) ? 1 : 0;

  return {
    x0: x0,
    y0: y0,
    rx: opts.rx,
    ry: opts.ry,
    phi: opts.phi,
    largeArc: largeArc,
    sweep: sweep,
    x1: x1,
    y1: y1
  };
};

var deg2rad = exports.deg2rad = function(deg) {
  return deg * 3.1415 / 180.0;
};

var rad2deg = exports.rad2deg = function(rad) {
  return rad * 180.0 / 3.1415;
};

var distance = exports.distance = function(pt1, pt2) {
  var dx = pt1.x - pt2.x;
  var dy = pt1.y - pt2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

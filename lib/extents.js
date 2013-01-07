'use strict';

var Extents = module.exports = function() {
  this.maxUnit = 0;
  this.min = {x: 0, y: 0};
  this.max = {x: 0, y: 0};
};

Extents.prototype.update = function(x, y) {
  this.min.x = Math.min(this.min.x, x);
  this.min.y = Math.min(this.min.y, y);
  this.max.x = Math.max(this.max.x, x);
  this.max.y = Math.max(this.max.y, y);
};

Extents.prototype.calculateSvgTransformString = function(size) {
  var scale = size / (this.max.x - this.min.x);
  scale = Math.min(scale, size / (this.max.y - this.min.y));
  scale = scale * 0.9;

  var translateX = -((this.max.x - this.min.x) / 2 + this.min.x);
  var translateY = -((this.max.y - this.min.y) / 2 + this.min.y);
  var translateCenterX = size / 2;
  var translateCenterY = size / 2;

  return 'translate(' + translateCenterX + ', ' + translateCenterY + ') scale(' + scale + ') translate(' + translateX + ', ' + translateY + ')';
};
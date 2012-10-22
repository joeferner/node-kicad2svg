'use strict';

var toXml = exports.toXml = function(data) {
  var result = '';
  data._children = data._children || [];
  result += "<" + data._name + attrsToXml(data._attrs) + ">";
  data._children.forEach(function(child) {
    if (child) {
      result += toXml(child);
    }
  });
  if (data._body) {
    result += data._body;
  }
  result += "</" + data._name + ">";

  return result;
};

function attrsToXml(attrs) {
  attrs = attrs || {};
  var result = '';
  for (var a in attrs) {
    result += ' ' + a + '="' + entitify(attrs[a]) + '"';
  }
  return result;
}

function entitify(str) {
  str = '' + str;
  str = str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&apos;')
    .replace(/"/g, '&quot;');
  return str;
}

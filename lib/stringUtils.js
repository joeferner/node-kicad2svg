'use string';

exports.splitOn = function(str, chars, maxMatches) {
  maxMatches = maxMatches || 99999;
  var parts = [];
  var part = '';
  var i;
  for (i = 0; i < str.length; i++) {
    if (chars.indexOf(str[i]) >= 0) {
      parts.push(part);
      part = '';
      if (parts.length >= maxMatches) {
        break;
      }
      while (chars.indexOf(str[i]) >= 0) {
        i++;
      }
      i--;
      continue;
    }
    part += str[i];
  }
  parts.offset = i;
  if (part.length > 0) {
    parts.push(part);
  }
  return parts;
};

exports.trim = function(str, chars) {
  if (!str) {
    return str;
  }
  var start = 0;
  var end = str.length;
  while (chars.indexOf(str[start]) >= 0) {
    start++;
  }
  while (chars.indexOf(str[end - 1]) >= 0) {
    end--;
  }
  return str.substring(start, end);
};

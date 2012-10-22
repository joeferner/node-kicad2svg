
# kicad2svg

Parses and converts KiCad .lib and .mod files into SVGs to display in a web browser.

## Usage

```javascript
var kicad2svg = require('kicad2svg');

var libData = kicad2svg.libParser('device.lib');
var libSvg = kicad2svg.libToSvg(libData.symbols['7SEG']);

var modData = kicad2svg.modParser('discret.mod');
var modSvg = kicad2svg.modToSvg(modData.symbols['78XXX']);
```

const indexOfMatch = require('./index-of-match.js');

function findTagByName(xml, tagName, options) {
  const debug = options && options.debug || false;

  const startIndex = options && options.startIndex || 0;

  if (debug) console.log("starting findTag with", tagName, " and ", options);

  const start = indexOfMatch(xml, `\<${tagName}[ \>]`, startIndex);
  if (debug) console.log("start:", start);
  if (start === -1) return undefined;

  const end = start + tagName.length + indexOfMatch(xml.slice(start + tagName.length), "[ \/]" + tagName + ">", 0) + 1 + tagName.length + 1;
  if (debug) console.log("end:", end);
  if (end === -1) return undefined;

  const outer = xml.slice(start, end);
  // tag is like <gml:identifier codeSpace="OGP">urn:ogc:def:crs:EPSG::32617</gml:identifier>

  const inner = outer.slice(outer.indexOf(">") + 1, outer.lastIndexOf("<"));

  return { inner, outer, start, end };
}

module.exports = findTagByName;

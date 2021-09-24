const test = require("flug");
const { readFileSync } = require("fs");
const indexOfMatch = require("../src/index-of-match.js");
const findTagByName = require("../src/find-tag-by-name.js");
const findTagsByName = require("../src/find-tags-by-name.js");
const findTagByPath = require("../src/find-tag-by-path.js");
const findTagsByPath = require("../src/find-tags-by-path.js");
const getAttribute = require("../src/get-attribute.js");

const iso = readFileSync("test/data/iso.xml", "utf-8");
const mrf = readFileSync("test/data/m_3008501_ne_16_1_20171018.mrf", "utf-8");
const tiffAux = readFileSync("test/data/rgb_raster.tif.aux.xml", "utf-8");

test("should get gmd:code and avoid gmd:codeSpace", ({ eq }) => {
  const index = indexOfMatch(iso, `\<gmd:code[ \>]`, 0);
  eq(iso.slice(index).startsWith("<gmd:code"), true);

  const tag = findTagByName(iso, "gmd:code", { startIndex: index + 1 });
  eq(tag, undefined);
});

test("should find all the urls in iso.xml", ({ eq }) => {
  const urls = findTagsByName(iso, "gmd:URL");
  eq(urls[0].inner, "http://geomap.arpa.veneto.it/layers/geonode%3Aatlanteil");
  eq(urls.length, 29);
});

test("should get only tags with full string match on tag name", ({ eq }) => {
  const urls = findTagsByName(iso, "gmd:code");
  eq(urls.length, 1);
});

test("should get info from iso.xml file", ({ eq }) => {
  const tag = findTagByPath(iso, ["gmd:RS_Identifier", "gmd:code", "gco:CharacterString"]);
  const projection = parseInt(tag.inner);
  eq(projection, 4326);

  const longitude = Number(findTagByPath(iso, ["gmd:westBoundLongitude", "gco:Decimal"]).inner);
  eq(longitude, 10.2822923743907);
});

test("should get raster size from a .mrf file", ({ eq }) => {
  const rasterSize = findTagByPath(mrf, ["MRF_META", "Raster", "Size"], {
    debug: false
  });
  eq(rasterSize.outer, '<Size x="6638" y="7587" c="4" />');
  eq(rasterSize.inner, null);
});

test("should get all character strings", ({ eq }) => {
  const tags = findTagsByPath(iso, ["gmd:RS_Identifier", "gmd:code"]);
  eq(tags.length, 1);
  eq(tags[0].inner === "", false);
});

test("should get all metadata for bands from .tif.aux.xml", ({ eq }) => {
  const debug = false;
  const mdis = findTagsByPath(tiffAux, ["Metadata", "MDI"], { debug });
  eq(mdis.length, 15);
});

test("should get attributes from metadata", ({ eq }) => {
  const mdi = findTagByPath(tiffAux, ["Metadata", "MDI"], { debug: false });
  const key = getAttribute(mdi, "key", { debug: false });
  eq(key, "SourceBandIndex");
});

test("should get raster width from a .mrf file", ({ eq }) => {
  const rasterSize = '<Size x="6638" y="7587" c="4" />';
  eq(getAttribute(rasterSize, "x"), "6638");
  eq(getAttribute(rasterSize, "y"), "7587");
  eq(getAttribute(rasterSize, "c"), "4");
});

const { expect } = require('chai');
const { readFileSync } = require('fs');
const indexOfMatch = require('../src/index-of-match.js');
const findTagByName = require('../src/find-tag-by-name.js');
const findTagsByName = require('../src/find-tags-by-name.js');
const findTagByPath = require('../src/find-tag-by-path.js');
const findTagsByPath = require('../src/find-tags-by-path.js');
const getAttribute = require('../src/get-attribute.js');

const iso = readFileSync('test/data/iso.xml', 'utf-8');
const mrf = readFileSync('test/data/m_3008501_ne_16_1_20171018.mrf', 'utf-8');
const tiffAux = readFileSync('test/data/rgb_raster.tif.aux.xml', 'utf-8');

describe('indexOfMatch', function() {
  it('should get gmd:code and avoid gmd:codeSpace', function() {
    const index = indexOfMatch(iso, `\<gmd:code[ \>]`, 0);
    expect(iso.slice(index).startsWith('<gmd:code')).to.equal(true);

    const tag = findTagByName(iso, 'gmd:code', { startIndex: index + 1 });
    expect(tag).to.equal(undefined);
  });
});

describe('findTagsByName', function() {
  it("should find all the urls in iso.xml", function() {
    const urls = findTagsByName(iso, "gmd:URL");
    expect(urls[0].inner).to.equal("http://geomap.arpa.veneto.it/layers/geonode%3Aatlanteil");
    expect(urls.length).to.equal(29);
  });
  it("should get only tags with full string match on tag name", function() {
    const urls = findTagsByName(iso, "gmd:code");
    expect(urls.length).to.equal(1);
  });
});

describe('findTagByPath', function() {
  it("should get info from iso.xml file", function() {
    const tag = findTagByPath(iso, ["gmd:RS_Identifier", "gmd:code", "gco:CharacterString"]);
    const projection = parseInt(tag.inner);
    expect(projection).to.equal(4326)

    const longitude = Number(findTagByPath(iso, ["gmd:westBoundLongitude", "gco:Decimal"]).inner);
    expect(longitude).to.equal(10.2822923743907);
  });
  it("should get raster size from a .mrf file", function() {
    const rasterSize = findTagByPath(mrf, ['MRF_META', 'Raster', 'Size'], { debug: false });
    expect(rasterSize.outer).to.equal('<Size x="6638" y="7587" c="4" />');
    expect(rasterSize.inner).to.equal(null);
  });
});

describe('findTagsByPath', function() {
  it("should get all character strings", function() {
    const tags = findTagsByPath(iso, ["gmd:RS_Identifier", "gmd:code"]);
    expect(tags.length).to.equal(1);
    expect(tags[0].inner).to.not.equal("");
  });
  it("should get all metadata for bands from .tif.aux.xml", function() {
    const debug = false;
    const mdis = findTagsByPath(tiffAux, ["Metadata", "MDI"], { debug });
    expect(mdis.length).to.equal(15);
  });
});

describe('getAttribute', function() {
  it("should get attributes from metadata", function() {
    const mdi = findTagByPath(tiffAux, ["Metadata", "MDI"], { debug: false });
    const key = getAttribute(mdi, 'key', { debug: false });
    expect(key).to.equal('SourceBandIndex');
  });
  it("should get raster width from a .mrf file", function() {
    const rasterSize = '<Size x="6638" y="7587" c="4" />';
    expect(getAttribute(rasterSize, 'x')).to.equal("6638");
    expect(getAttribute(rasterSize, 'y')).to.equal("7587");
    expect(getAttribute(rasterSize, 'c')).to.equal("4");
  });
});

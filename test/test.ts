import test from "flug";
// @ts-ignore
import { readFileSync } from "node:fs";
import { findTagByName, findTagsByName, findTagByPath, findTagsByPath, getAttribute, removeTagsByName } from "../index";

const iso = readFileSync("test/data/iso.xml", "utf-8");
const mrf = readFileSync("test/data/m_3008501_ne_16_1_20171018.mrf", "utf-8");
const tiffAux = readFileSync("test/data/rgb_raster.tif.aux.xml", "utf-8");

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
  const projection = parseInt(tag!.inner!);
  eq(projection, 4326);

  const longitude = Number(findTagByPath(iso, ["gmd:westBoundLongitude", "gco:Decimal"])!.inner);
  eq(longitude, 10.2822923743907);
});

test("should get raster size from a .mrf file", ({ eq }) => {
  const rasterSize = findTagByPath(mrf, ["MRF_META", "Raster", "Size"], {
    debug: false
  })!;
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
  const key = getAttribute(mdi!, "key", { debug: false });
  eq(key, "SourceBandIndex");
});

test("should get raster width from a .mrf file", ({ eq }) => {
  const rasterSize = '<Size x="6638" y="7587" c="4" />';
  eq(getAttribute(rasterSize, "x"), "6638");
  eq(getAttribute(rasterSize, "y"), "7587");
  eq(getAttribute(rasterSize, "c"), "4");
});

test("should get first tag", ({ eq }) => {
  const xml = `<fields> <field datatype="text" name="L101"/> <field datatype="text" name="L101_1"/> <field datatype="text" name="P102"/> <field datatype="text" name="P102_1"> <source></source> <param></param> </field> <field datatype="text" name="P103"></field> </fields>`;
  const tag = findTagByName(xml, "field", { debug: false })!;
  eq(tag.outer, `<field datatype="text" name="L101"/>`);

  const tag2 = findTagByName(xml, "field", { debug: false, nested: false })!;
  eq(tag2.outer, `<field datatype="text" name="L101"/>`);
});

test("should get all tags (self-closing and not)", ({ eq }) => {
  const xml = `<fields> <field datatype="text" name="L101"/> <field datatype="text" name="L101_1"/> <field datatype="text" name="P102"/> <field datatype="text" name="P102_1"> <source></source> <param></param> </field> <field datatype="text" name="P103"></field> </fields>`;
  const tags = findTagsByName(xml, "field", { debug: false });
  eq(tags.length, 5);
});

test("should get self-closing with immediate close and without interior space", ({ eq }) => {
  const xml = `<House><Kitchen/></House>`;
  const tag = findTagByName(xml, "Kitchen")!;
  eq(tag.outer, "<Kitchen/>");
  eq(tag.inner, null);
});

test("should handle nested tags", ({ eq }) => {
  const xml = `<Thing><Thing sub1>A</Thing><Thing sub2>B</Thing></Thing>`;

  eq(findTagByName(xml, "Thing")!.outer, xml);
  eq(findTagByName(xml, "Thing")!.outer, xml);

  eq(findTagsByName(xml, "Thing").length, 3);
  eq(findTagsByName(xml, "Thing")[0].outer, xml);
  eq(findTagsByName(xml, "Thing", { nested: true }).length, 3);
  eq(findTagsByName(xml, "Thing", { nested: true })[0].outer, xml);
  eq(findTagsByName(xml, "Thing", { nested: false }).length, 1);
  eq(findTagsByName(xml, "Thing", { nested: false })[0].outer, xml);

  eq(findTagsByPath(xml, ["Thing"]).length, 1);
  eq(findTagsByPath(xml, ["Thing"])[0].outer, xml);
  eq(findTagsByPath(xml, ["Thing", "Thing"]), [
    { inner: "A", outer: "<Thing sub1>A</Thing>", start: 7, end: 28 },
    { inner: "B", outer: "<Thing sub2>B</Thing>", start: 28, end: 49 }
  ]);
  eq(findTagByPath(xml, ["Thing"])!.outer, xml);
});

test("removeTagsByName", ({ eq }) => {
  eq(removeTagsByName("<ul><li>A</li><li>B</li></ul>", "li"), "<ul></ul>");
});

"use strict";
const cheerio = require("cheerio");
const formatExtensions = {
  htmlImages: {
    extension: ".html.images",
  },
  htmlNoImages: {
    extension: "-h.htm",
  },
  epubNoImages: {
    extension: ".epub.noimages",
  },
  epubImages: {
    extension: ".epub.images",
  },
  epub3Images: {
    extension: ".epub3.images",
  },
  kindleImages: {
    extension: ".kf8.images",
  },
  kindleOldImages: {
    extension: ".kindle.images",
  },
  kindleNoImages: {
    extension: ".kindle.noimages",
  },
  "text-0": {
    extension: "-0.txt",
  },
  textUTF8: {
    extension: ".txt.utf-8",
  },
  rdf: {
    extension: ".rdf",
  },
  "zip-0": {
    extension: "-0.zip",
  },
  "zip-h": {
    extension: "-h.zip",
  },
};
module.exports = (rdf) => {
  const $ = cheerio.load(rdf);
  const book = {};
  book.id = +$("pgterms\\:ebook").attr("rdf:about").replace("ebooks/", "");
  book.title = $("dcterms\\:title").text();
  book.authors = $("pgterms\\:agent pgterms\\:name")
    .toArray()
    .map((element) => $(element).text());
  book.subjects = $('[rdf\\:resource$="/LCSH"]')
    .parent()
    .find("rdf\\:value")
    .toArray()
    .map((element) => $(element).text());
  book.lcc = $('[rdf\\:resource$="/LCC"]').parent().find("rdf\\:value").text();
  book.formats = (() => {
    const formats = {};
    $("dcterms\\:hasFormat pgterms\\:file")
      .toArray()
      .map((elm) => $(elm).attr("rdf:about"))
      .forEach((url) => {
        const formatKey = Object.keys(formatExtensions).find((formatKey) =>
          url.endsWith(formatExtensions[formatKey].extension)
        );
        if (formatKey !== undefined) formats[formatKey] = url;
      });
    return formats;
  })();

  return book;
};

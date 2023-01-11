"use strict";
const rp = require("request-promise");

module.exports = (app, es) => {
  const url = `http://${es.host}:${es.port}/${es.bundles_index}/_doc`;

  app.post("/api/bundle", (req, res) => {
    const bundle = {
      name: req.query.name || "",
      books: [],
    };
    rp.post({ url, body: bundle, json: true })
      .then((esResBody) => res.status(201).json(esResBody))
      .catch((error) => res.status(error.status || 502).json(error));
  });

  app.get("/api/bundle/:id", async (req, res) => {
    const options = {
      url: `${url}/${req.params.id}`,
      json: true,
    };
    try {
      const esResBody = await rp(options);
      res.status(200).json(esResBody);
    } catch (esResErr) {
      res.status(esResErr.statusCode || 502).json(esResErr.error);
    }
  });

  app.put("/api/bundle/:id/name/:name", async (req, res) => {
    const bundleUrl = `${url}/${req.params.id}`;
    try {
      const bundle = (await rp({ url: bundleUrl, json: true }))._source;
      bundle.name = req.params.name;
      const esResBody = await rp.put({
        url: bundleUrl,
        json: true,
        body: bundle,
      });
      res.status(200).json(esResBody);
    } catch (esResErr) {
      res.status(esResErr.statusCode || 502).json(esResErr.error);
    }
  });

  app.put("/api/bundle/:id/book/:pgid", async (req, res) => {
    const bundleUrl = `${url}/${req.params.id}`;
    const bookUrl = `http://${es.host}:${es.port}/${es.books_index}/_doc/${req.params.pgid}`;

    try {
      const [bundlesRes, bookRes] = await Promise.all([
        rp({ url: bundleUrl, json: true }),
        rp({ url: bookUrl, json: true }),
      ]);
      const {
        _source: bundle,
        _seq_no: if_seq_no,
        _primary_term: if_primary_term,
      } = bundlesRes;
      const { _source: book } = bookRes;
      const idx = bundle.books.findIndex((book) => book.id === req.params.pgid);
      if (idx === -1) {
        bundle.books.push({
          id: req.params.pgid,
          title: book.title,
        });
      }
      const esResBody = await rp.put({
        url: bundleUrl,
        qs: { if_seq_no, if_primary_term },
        body: bundle,
        json: true,
      });
      res.status(200).json(esResBody);
    } catch (esResErr) {
      res.status(esResErr.statusCode || 502).json(esResErr.error);
    }
  });

  app.delete("/api/bundle/:id", async (req, res) => {
    const bundleUrl = `${url}/${req.params.id}`;
    try {
      const esResBody = await rp.delete({ url: bundleUrl });
      res.status(200).json(esResBody);
    } catch (esResErr) {
      res.status(esResErr.statusCode || 502).json(esResErr.error);
    }
  });

  app.delete("/api/bundle/:id/book/:pgid", async (req, res) => {
    const bundleUrl = `${url}/${req.params.id}`;
    try {
      const {
        _source: bundle,
        _seq_no: if_seq_no,
        _primary_term: if_primary_term,
      } = await rp.get(bundleUrl);

      bundle.books.splice(
        bundle.books.findIndex((book) => book.id === req.params.id),
        1
      );

      const esResBody = await rp.put({
        url: bundleUrl,
        qs: { if_seq_no, if_primary_term },
        body: bundle,
        json: true,
      });
      res.status(204);
    } catch (esResErr) {
      res
        .status(esResErr.statusCode || 502)
        .json(esResErr.error || esResErr.message);
    }
  });
};

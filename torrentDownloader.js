const WebTorrent = require("webtorrent");
const fs = require("fs");

const client = new WebTorrent();

exports.downloadTorrent = (magnet, downloadPath) =>
  new Promise((resolve, reject) => {
    client.add(magnet, { path: downloadPath }, torrent => {
      torrent.on("done", () => {
        resolve(torrent.files.map(f => f.path));
      });

      torrent.on("error", err => reject(err));
    });
  });

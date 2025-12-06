import WebTorrent, { Torrent } from "webtorrent";

const client = new WebTorrent();

export function downloadTorrent(magnet: string, downloadPath: string): Promise<Torrent> {
  return new Promise((resolve, reject) => {
    client.add(magnet, { path: downloadPath }, (torrent: Torrent) => {
      resolve(torrent);

      torrent.on("error", reject);
    });
  });
}

import WebTorrent, { Torrent } from "webtorrent";

const client = new WebTorrent();

export function downloadTorrent(magnet: string, downloadPath: string): Promise<Torrent> {
  return new Promise((resolve, reject) => {
    client.add(magnet, {
      path: downloadPath,
      announce: [
        "https://tracker.opentrackr.org:443/announce",
        "https://tracker.fastdownload.xyz:443/announce",
        "https://tracker.torrent.eu.org:443/announce"
      ]
    }, (torrent: Torrent) => {
      resolve(torrent);

      torrent.on("error", reject);
    });
  });
}

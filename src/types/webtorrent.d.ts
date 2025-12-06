declare module "webtorrent" {
  /** A file inside a torrent */
  export interface TorrentFile {
    name: string;
    path: string;
    length: number;

    /**
     * Create a readable stream of this file.
     * You can stream file content without writing to disk.
     */
    createReadStream(opts?: any): NodeJS.ReadableStream;
  }

  /** Main torrent object */
  export interface Torrent {
    name: string;
    infoHash: string;

    /** Total size of the torrent in bytes */
    length: number;

    /** Bytes downloaded so far */
    downloaded: number;

    /** Bytes uploaded so far */
    uploaded: number;

    /** Download progress between 0 and 1 */
    progress: number;

    /** Download speed in bytes/sec */
    downloadSpeed: number;

    /** Upload speed in bytes/sec */
    uploadSpeed: number;

    /** Estimated remaining time in ms */
    timeRemaining: number;

    /** Whether the torrent is completed */
    done: boolean;

    /** The files in the torrent */
    files: TorrentFile[];

    /** Fired when metadata has been fetched */
    on(event: "metadata", callback: () => void): void;

    /** Fired repeatedly as data is downloaded */
    on(event: "download", callback: (bytes: number) => void): void;

    /** Fired when the torrent is fully downloaded */
    on(event: "done", callback: () => void): void;

    /** Warning events (non-fatal errors) */
    on(event: "warning", callback: (err: Error) => void): void;

    /** Peer events */
    on(event: "wire", callback: (wire: any, addr: string) => void): void;

    /** No peers found */
    on(event: "noPeers", callback: (announceType: string) => void): void;

    /** Fatal error */
    on(event: "error", callback: (err: Error) => void): void;

    /** Generic catch-all */
    on(event: string, callback: (...args: any[]) => void): void;

    /** Destroy this torrent */
    destroy(cb?: (err?: Error) => void): void;
  }

  /** Options when adding a torrent */
  export interface AddOptions {
    path?: string;
    announce?: string[];
    maxWebConns?: number;
  }

  /** Main WebTorrent client */
  export default class WebTorrent {
    constructor(options?: any);

    add(
      magnetUri: string,
      options: AddOptions,
      callback: (torrent: Torrent) => void
    ): void;

    get(infoHashOrTorrentId: string): Torrent | undefined;

    /** Stop everything */
    destroy(callback?: (err?: Error) => void): void;
  }
}

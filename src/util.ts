export function formatBytes(bytes: number): string {
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 B";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

export function progressBar(percent: number): string {
  const totalBlocks = 20;
  const filled = Math.round((percent / 100) * totalBlocks);
  return "█".repeat(filled) + "░".repeat(totalBlocks - filled);
}

export function eta(timeLeftMs: number): string {
  if (timeLeftMs < 1000) return "few sec";
  const min = Math.floor(timeLeftMs / 60000);
  const sec = Math.floor((timeLeftMs % 60000) / 1000);
  return `${min}m ${sec}s`;
}

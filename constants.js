
export const APP_NAME = "CloudVault";

export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const generateDynamicKey = (userId) => {
  // Generates a key that changes every 4 hours
  const hours = Math.floor(Date.now() / (1000 * 60 * 60 * 4));
  const seed = userId + hours.toString();
  // Simple hash for demo purposes
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).toUpperCase().substring(0, 8);
};

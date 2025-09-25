let cryptoCache = null;
let lastCacheTime = 0;

module.exports = {
  getCryptoCache: () => cryptoCache,
  setCryptoCache: (data) => {
    cryptoCache = data;
    lastCacheTime = Date.now();
  },
  getLastCacheTime: () => lastCacheTime,
};
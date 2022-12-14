const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_COUNT = 100;

export default class MemCache {
  caches: Record<string, [number, string]> = {};

  count = 0;

  removeOutdated() {
    // clear outdated caches
    Object.keys(this.caches).forEach((key) => {
      const [cacheTime] = this.caches[key];
      if (Date.now() - cacheTime > CACHE_DURATION) {
        delete this.caches[key];
        this.count -= 1;
      }
    });
  }

  removeEarliest() {
    // clear earliest caches
    const { key } = Object.keys(this.caches).reduce((lastValue, cacheKey) => {
      const [cacheTime] = this.caches[cacheKey];
      if (cacheTime < lastValue.cacheTime) {
        return {
          cacheTime,
          key: cacheKey,
        };
      }
      return lastValue;
    }, {
      cacheTime: Number.POSITIVE_INFINITY,
      key: '',
    });

    if (this.caches[key]) {
      delete this.caches[key];
      this.count -= 1;
    }
  }

  set(cacheKey: string, content: string) {
    if (cacheKey) {
      if (!this.caches[cacheKey]) {
        while (this.count >= MAX_COUNT) {
          this.removeEarliest();
        }
        this.count += 1;
      }
      this.caches[cacheKey] = [
        Date.now(),
        content,
      ];
    }
  }

  get(cacheKey: string): string | undefined {
    this.removeOutdated();
    const match = this.caches[cacheKey];
    if (match) {
      return match[1];
    }
    return undefined;
  }
}

/**
 * ENHANCED BOT CONFIG CACHE
 * 
 * Centralized caching layer for bot configurations with:
 * - In-memory cache with configurable TTL
 * - Automatic invalidation on updates
 * - Multi-tenant isolation (cache keys include clientId + botId)
 * - Statistics for monitoring cache performance
 */

import { BotConfig, getBotConfigAsync, clearCache as clearBotConfigCache, getBotsByWorkspaceId } from './botConfig';
import { storage } from './storage';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  createdAt: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  evictions: number;
}

class ConfigCache {
  private botConfigCache: Map<string, CacheEntry<BotConfig>> = new Map();
  private clientSettingsCache: Map<string, CacheEntry<any>> = new Map();
  private stats: CacheStats = { hits: 0, misses: 0, size: 0, evictions: 0 };
  
  private readonly BOT_CONFIG_TTL = 60 * 1000; // 60 seconds
  private readonly CLIENT_SETTINGS_TTL = 120 * 1000; // 2 minutes
  private readonly MAX_CACHE_SIZE = 500; // Maximum entries

  /**
   * Generate cache key for bot config (multi-tenant safe)
   */
  private getBotCacheKey(clientId: string, botId: string): string {
    return `bot:${clientId}:${botId}`;
  }

  /**
   * Generate cache key for client settings
   */
  private getClientSettingsCacheKey(clientId: string): string {
    return `settings:${clientId}`;
  }

  /**
   * Check if a cache entry is still valid
   */
  private isValid<T>(entry: CacheEntry<T> | undefined): boolean {
    if (!entry) return false;
    return Date.now() < entry.expiresAt;
  }

  /**
   * Evict oldest entries if cache is full
   */
  private evictIfNeeded(): void {
    const totalSize = this.botConfigCache.size + this.clientSettingsCache.size;
    
    if (totalSize >= this.MAX_CACHE_SIZE) {
      // Evict 10% of oldest entries from each cache
      const evictCount = Math.ceil(this.MAX_CACHE_SIZE * 0.1);
      
      // Sort by createdAt and evict oldest
      const botEntries = Array.from(this.botConfigCache.entries())
        .sort((a, b) => a[1].createdAt - b[1].createdAt);
      
      for (let i = 0; i < Math.min(evictCount, botEntries.length); i++) {
        this.botConfigCache.delete(botEntries[i][0]);
        this.stats.evictions++;
      }
      
      const settingsEntries = Array.from(this.clientSettingsCache.entries())
        .sort((a, b) => a[1].createdAt - b[1].createdAt);
      
      for (let i = 0; i < Math.min(evictCount, settingsEntries.length); i++) {
        this.clientSettingsCache.delete(settingsEntries[i][0]);
        this.stats.evictions++;
      }
    }
    
    this.stats.size = this.botConfigCache.size + this.clientSettingsCache.size;
  }

  /**
   * Get bot configuration with caching
   */
  async getBotConfig(clientId: string, botId: string): Promise<BotConfig | null> {
    const cacheKey = this.getBotCacheKey(clientId, botId);
    const cached = this.botConfigCache.get(cacheKey);
    
    if (this.isValid(cached)) {
      this.stats.hits++;
      return cached!.data;
    }
    
    this.stats.misses++;
    
    // Fetch from database/filesystem
    const config = await getBotConfigAsync(clientId, botId);
    
    if (config) {
      this.evictIfNeeded();
      this.botConfigCache.set(cacheKey, {
        data: config,
        expiresAt: Date.now() + this.BOT_CONFIG_TTL,
        createdAt: Date.now(),
      });
      this.stats.size = this.botConfigCache.size + this.clientSettingsCache.size;
    }
    
    return config;
  }

  /**
   * Get client settings with caching
   */
  async getClientSettings(clientId: string): Promise<any | null> {
    const cacheKey = this.getClientSettingsCacheKey(clientId);
    const cached = this.clientSettingsCache.get(cacheKey);
    
    if (this.isValid(cached)) {
      this.stats.hits++;
      return cached!.data;
    }
    
    this.stats.misses++;
    
    // Fetch from storage
    const settings = await storage.getSettings(clientId);
    
    if (settings) {
      this.evictIfNeeded();
      this.clientSettingsCache.set(cacheKey, {
        data: settings,
        expiresAt: Date.now() + this.CLIENT_SETTINGS_TTL,
        createdAt: Date.now(),
      });
      this.stats.size = this.botConfigCache.size + this.clientSettingsCache.size;
    }
    
    return settings;
  }

  /**
   * Invalidate bot config cache entry
   */
  invalidateBotConfig(clientId: string, botId: string): void {
    const cacheKey = this.getBotCacheKey(clientId, botId);
    this.botConfigCache.delete(cacheKey);
    this.stats.size = this.botConfigCache.size + this.clientSettingsCache.size;
    
    // Also clear the underlying botConfig.ts cache
    clearBotConfigCache();
  }

  /**
   * Invalidate client settings cache entry
   */
  invalidateClientSettings(clientId: string): void {
    const cacheKey = this.getClientSettingsCacheKey(clientId);
    this.clientSettingsCache.delete(cacheKey);
    this.stats.size = this.botConfigCache.size + this.clientSettingsCache.size;
  }

  /**
   * Invalidate all cache entries for a client (multi-tenant safe)
   */
  invalidateClient(clientId: string): void {
    // Remove all bot configs for this client
    const keysToDelete: string[] = [];
    const keys = Array.from(this.botConfigCache.keys());
    for (const key of keys) {
      if (key.startsWith(`bot:${clientId}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.botConfigCache.delete(key));
    
    // Remove client settings
    this.invalidateClientSettings(clientId);
    
    this.stats.size = this.botConfigCache.size + this.clientSettingsCache.size;
    clearBotConfigCache();
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    this.botConfigCache.clear();
    this.clientSettingsCache.clear();
    this.stats = { hits: 0, misses: 0, size: 0, evictions: 0 };
    clearBotConfigCache();
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { hitRate: string } {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? ((this.stats.hits / total) * 100).toFixed(1) + '%' : '0%';
    return {
      ...this.stats,
      hitRate,
    };
  }

  /**
   * Warm up cache for a specific client (preload all their bots)
   */
  async warmupClient(clientId: string): Promise<number> {
    const bots = await getBotsByWorkspaceId(clientId);
    let loaded = 0;
    
    for (const bot of bots) {
      await this.getBotConfig(clientId, bot.botId);
      loaded++;
    }
    
    return loaded;
  }
}

// Singleton instance
export const configCache = new ConfigCache();

// Export for testing
export { ConfigCache };

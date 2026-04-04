# Redis Caching Layer for AI Service
# Provides caching for forecasts, predictions, and recommendations

import json
import hashlib
from typing import Optional, Any
from datetime import timedelta
import redis
import os

# Redis connection
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/1')

class CacheService:
    """Redis caching service for AI predictions"""
    
    def __init__(self):
        self.redis_client = redis.from_url(REDIS_URL, decode_responses=True)
        self.default_ttl = 3600  # 1 hour default
    
    def _generate_key(self, prefix: str, **kwargs) -> str:
        """Generate cache key from parameters"""
        key_parts = [prefix]
        for k, v in sorted(kwargs.items()):
            key_parts.append(f"{k}:{v}")
        key_string = ":".join(key_parts)
        # Hash long keys
        if len(key_string) > 200:
            return f"{prefix}:{hashlib.md5(key_string.encode()).hexdigest()}"
        return key_string
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        try:
            value = self.redis_client.get(key)
            if value:
                return json.loads(value)
        except Exception as e:
            print(f"Cache get error: {e}")
        return None
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set value in cache"""
        try:
            ttl = ttl or self.default_ttl
            self.redis_client.setex(key, ttl, json.dumps(value))
            return True
        except Exception as e:
            print(f"Cache set error: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        """Delete value from cache"""
        try:
            self.redis_client.delete(key)
            return True
        except Exception as e:
            print(f"Cache delete error: {e}")
            return False
    
    def invalidate_pattern(self, pattern: str) -> int:
        """Invalidate all keys matching pattern"""
        try:
            keys = self.redis_client.keys(pattern)
            if keys:
                return self.redis_client.delete(*keys)
            return 0
        except Exception as e:
            print(f"Cache invalidate error: {e}")
            return 0
    
    # Forecast caching
    def get_forecast(self, product_id: str, horizon: int) -> Optional[Any]:
        """Get cached forecast"""
        key = self._generate_key("forecast", product_id=product_id, horizon=horizon)
        return self.get(key)
    
    def set_forecast(self, product_id: str, horizon: int, data: Any, ttl: int = 1800) -> bool:
        """Cache forecast (30 min default)"""
        key = self._generate_key("forecast", product_id=product_id, horizon=horizon)
        return self.set(key, data, ttl)
    
    # Stockout prediction caching
    def get_stockout_prediction(self, inventory_item_id: str) -> Optional[Any]:
        """Get cached stockout prediction"""
        key = self._generate_key("stockout", item_id=inventory_item_id)
        return self.get(key)
    
    def set_stockout_prediction(self, inventory_item_id: str, data: Any, ttl: int = 3600) -> bool:
        """Cache stockout prediction (1 hour default)"""
        key = self._generate_key("stockout", item_id=inventory_item_id)
        return self.set(key, data, ttl)
    
    # Inventory optimization caching
    def get_optimization(self, inventory_item_id: str) -> Optional[Any]:
        """Get cached optimization"""
        key = self._generate_key("optimization", item_id=inventory_item_id)
        return self.get(key)
    
    def set_optimization(self, inventory_item_id: str, data: Any, ttl: int = 7200) -> bool:
        """Cache optimization (2 hours default)"""
        key = self._generate_key("optimization", item_id=inventory_item_id)
        return self.set(key, data, ttl)
    
    # Production schedule caching
    def get_schedule(self, date: str, algorithm: str) -> Optional[Any]:
        """Get cached schedule"""
        key = self._generate_key("schedule", date=date, algorithm=algorithm)
        return self.get(key)
    
    def set_schedule(self, date: str, algorithm: str, data: Any, ttl: int = 1800) -> bool:
        """Cache schedule (30 min default)"""
        key = self._generate_key("schedule", date=date, algorithm=algorithm)
        return self.set(key, data, ttl)
    
    def invalidate_all_forecasts(self) -> int:
        """Invalidate all cached forecasts"""
        return self.invalidate_pattern("forecast:*")
    
    def invalidate_all_stockouts(self) -> int:
        """Invalidate all cached stockout predictions"""
        return self.invalidate_pattern("stockout:*")
    
    def invalidate_all_optimizations(self) -> int:
        """Invalidate all cached optimizations"""
        return self.invalidate_pattern("optimization:*")
    
    def invalidate_all_schedules(self) -> int:
        """Invalidate all cached schedules"""
        return self.invalidate_pattern("schedule:*")
    
    def get_cache_stats(self) -> dict:
        """Get cache statistics"""
        try:
            info = self.redis_client.info('stats')
            memory_info = self.redis_client.info('memory')
            return {
                'total_connections': info.get('total_connections_received', 0),
                'total_commands': info.get('total_commands_processed', 0),
                'keyspace_hits': info.get('keyspace_hits', 0),
                'keyspace_misses': info.get('keyspace_misses', 0),
                'used_memory': memory_info.get('used_memory_human', 'N/A'),
            }
        except Exception as e:
            return {'error': str(e)}


# Singleton instance
cache_service = CacheService()

# Decorator for caching
def cached(prefix: str, ttl: Optional[int] = None):
    """Decorator for caching function results"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            # Generate cache key from function name and arguments
            cache_key = f"{prefix}:{func.__name__}:{str(args)}:{str(kwargs)}"
            
            # Try to get from cache
            cached_value = cache_service.get(cache_key)
            if cached_value is not None:
                return cached_value
            
            # Execute function
            result = func(*args, **kwargs)
            
            # Cache result
            cache_service.set(cache_key, result, ttl)
            
            return result
        return wrapper
    return decorator

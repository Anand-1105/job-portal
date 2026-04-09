"""
Global rate limiter for Gemini API — 5 requests per minute max.
Uses a token bucket approach with asyncio.
"""
import asyncio
import time

class RateLimiter:
    def __init__(self, max_per_minute: int = 5):
        self.max_per_minute = max_per_minute
        self.min_interval = 60.0 / max_per_minute  # seconds between requests
        self._lock = asyncio.Lock()
        self._last_request_time = 0.0

    async def acquire(self):
        async with self._lock:
            now = time.monotonic()
            elapsed = now - self._last_request_time
            wait_time = self.min_interval - elapsed
            if wait_time > 0:
                await asyncio.sleep(wait_time)
            self._last_request_time = time.monotonic()

# Global singleton — shared across all chains
gemini_limiter = RateLimiter(max_per_minute=4)  # use 4 to leave headroom

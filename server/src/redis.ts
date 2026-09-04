import Redis from 'ioredis';

// Attempt to connect to the Redis service defined in docker-compose.yml
// It will default to localhost:6379 if not otherwise specified.
export const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  retryStrategy(times) {
    // Retry connection every 5 seconds if disconnected
    return Math.min(times * 50, 5000);
  },
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redis.on('connect', () => {
  console.log('Connected to Redis cache successfully.');
});

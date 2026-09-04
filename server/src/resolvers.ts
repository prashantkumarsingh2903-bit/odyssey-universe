import axios from 'axios';
import { redis } from './redis';

const NASA_API_KEY = process.env.NASA_API_KEY || 'DEMO_KEY';
const CACHE_TTL = 60 * 60 * 24; // 24 hours

export const resolvers = {
  Query: {
    getNearEarthObjects: async (_: any, { startDate, endDate }: { startDate: string, endDate: string }) => {
      const cacheKey = `neows:${startDate}:${endDate}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      try {
        const response = await axios.get('https://api.nasa.gov/neo/rest/v1/feed', {
          params: {
            start_date: startDate,
            end_date: endDate,
            api_key: NASA_API_KEY,
          },
          timeout: 10000,
        });

        const nearEarthObjects = response.data.near_earth_objects;
        const flatAsteroids: any[] = [];

        Object.keys(nearEarthObjects).forEach((date) => {
          nearEarthObjects[date].forEach((neo: any) => {
            const approachData = neo.close_approach_data[0] || {};
            flatAsteroids.push({
              id: neo.id,
              name: neo.name,
              absolute_magnitude_h: neo.absolute_magnitude_h,
              estimated_diameter_min_km: neo.estimated_diameter?.kilometers?.estimated_diameter_min,
              estimated_diameter_max_km: neo.estimated_diameter?.kilometers?.estimated_diameter_max,
              is_potentially_hazardous_asteroid: neo.is_potentially_hazardous_asteroid,
              close_approach_date: approachData.close_approach_date,
              relative_velocity_km_per_s: approachData.relative_velocity?.kilometers_per_second,
              miss_distance_km: approachData.miss_distance?.kilometers,
            });
          });
        });

        await redis.set(cacheKey, JSON.stringify(flatAsteroids), 'EX', CACHE_TTL);
        return flatAsteroids;
      } catch (error) {
        console.error('Error fetching NeoWs data:', error);
        throw new Error('Failed to fetch data from NASA API. It may be timing out or rate-limited.');
      }
    },
    getAstronomyPictureOfTheDay: async (_: any, { date }: { date?: string }) => {
      const cacheKey = `apod:${date || 'today'}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      try {
        const response = await axios.get('https://api.nasa.gov/planetary/apod', {
          params: {
            date,
            hd: true,
            api_key: NASA_API_KEY,
          },
          timeout: 10000,
        });

        const skybox = {
          url: response.data.hdurl || response.data.url,
          title: response.data.title,
          explanation: response.data.explanation,
          date: response.data.date,
        };

        await redis.set(cacheKey, JSON.stringify(skybox), 'EX', CACHE_TTL);
        return skybox;
      } catch (error) {
        console.error('Error fetching APOD data:', error);
        throw new Error('Failed to fetch data from NASA API.');
      }
    }
  }
};

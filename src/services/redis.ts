import Redis from 'ioredis';
import { AI_CONFIG } from '../config';

export const redis = new Redis(AI_CONFIG.redisUrl);

// lib/redis.ts
import { Redis } from '@upstash/redis'

// 環境変数から接続情報を取得
const redis = new Redis({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
})

export default redis;

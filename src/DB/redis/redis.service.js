import { redis_client } from "./redis.connect.js";

export const revoke_key = ({ userId, jti }) => {
  return `revoke_token::${userId}::${jti}`;
};

export const get_key = ({ userId }) => {
  return `revoke_token::${userId}`;
};

export const setValue = async ({ key, value, ttl }) => {
  try {
    const data = typeof value == "string" ? value : JSON.stringify(value);
    return ttl
      ? await redis_client.set(key, data, { EX: ttl })
      : await redis_client.set(key, data);
  } catch (error) {
    console.log(error, "fail to set operation");
  }
};

export const update = async ({ key, value, ttl }) => {
  try {
    if (!(await redis_client.exists(key))) return 0;
    return await setValue({ key, value, ttl });
  } catch (error) {
    console.log(error, "fail to update operation");
  }
};

export const get = async (key) => {
  try {
    try {
      return JSON.parse(await redis_client.get(key));
    } catch (error) {
      return await redis_client.get(key);
    }
  } catch (error) {
    console.log(error, "fail to get operation");
  }
};

export const ttl = async (key) => {
  try {
    return await redis_client.ttl(key);
  } catch (error) {
    console.log(error, "fail to TTL operation");
  }
};

export const exists = async (key) => {
  try {
    return await redis_client.exists(key);
  } catch (error) {
    console.log(error, "fail to exists operation");
  }
};

export const keys = async (pattern) => {
  try {
    return redis_client.keys(`${pattern}*`);
  } catch (error) {
    console.log(error, "fail to keys operation");
  }
};

export const deleteKey = async (key) => {
  try {
    if (!key.length) return 0;
    return await redis_client.del(key);
  } catch (error) {
    console.log(error, "fail to keys operation");
  }
};

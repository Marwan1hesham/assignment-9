import { redis_client } from "./redis.connect.js";

export const revoke_key = ({ userId, jti }) => {
  return `revoke_token::${userId}::${jti}`;
};

export const get_key = ({ userId }) => {
  return `revoke_token::${userId}`;
};

export const otp_key = ({ email, subject }) => {
  return `otp::${email}::${subject}`;
};

export const max_otp_key = ({ email }) => {
  return `${otp_key({ email })}::max_tries`;
};

export const max_login_key = ({ email }) => {
  return `login::${email}::max_tries`;
};

export const block_login_key = ({ email }) => {
  return `login::${email}::blocked`;
};

export const block_otp_key = ({ email }) => {
  return `${otp_key({ email })}::block`;
};

export const two_step_otp_key = ({ email }) => {
  return `${otp_key({ email })}::two_step`;
};

export const confirm_two_step_key = ({ email }) => {
  return `${otp_key({ email })}::confirm_two_step`;
};

export const forget_password_key = () => {
  return `otp::forget_password`;
};

export const email_cache = ({ tempToken }) => {
  return `email::${tempToken}::confirm_login`;
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

export const incr = async (key) => {
  try {
    return redis_client.incr(key);
  } catch (error) {
    console.log(error, "fail to increment operation");
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

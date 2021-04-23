import { boolean, object, string } from 'joi';

export default object({
  STARTING_BAN: string(),
  MONGO_URI: string().required(),
  REDIS_URL: string().required(),
  DISCORD_ROLE: string().required(),
  WEBHOOK_URL: string().required(),
  DEBUG: boolean().default(false),
});

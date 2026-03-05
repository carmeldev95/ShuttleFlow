import { createApp } from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";

await connectDb();

const app = createApp();

app.listen(env.port, () => {
  logger.info(`Server listening on :${env.port}`);
});
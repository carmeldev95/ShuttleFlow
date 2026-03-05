import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "./logger.js";

let cached = global.__mongoose;
if (!cached) cached = global.__mongoose = { conn: null, promise: null };

export async function connectDb() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(env.mongoUri, { dbName: "shuttleflow" })
      .then((m) => m);
  }

  cached.conn = await cached.promise;
  logger.info("MongoDB connected");
  return cached.conn;
}
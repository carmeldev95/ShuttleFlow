import { createApp } from "../src/app.js";
import { connectDb } from "../src/config/db.js";

const app = createApp();

export default async function handler(req, res) {
  // OPTIONS preflight — no DB needed, Express + cors() handles it immediately
  if (req.method !== "OPTIONS") {
    try {
      await connectDb();
    } catch {
      // DB failed — still pass to Express so cors() adds headers before error response
    }
  }
  return app(req, res);
}
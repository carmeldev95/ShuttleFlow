import { createApp } from "../src/app.js";
import { connectDb } from "../src/config/db.js";

const app = createApp();

export default async function handler(req, res) {
  await connectDb();
  return app(req, res);
}
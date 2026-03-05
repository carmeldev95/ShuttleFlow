import dotenv from "dotenv";
dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 8080),

  mongoUri: process.env.MONGO_URI,

  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpires: process.env.JWT_ACCESS_EXPIRES || "15m",
    refreshExpires: process.env.JWT_REFRESH_EXPIRES || "14d",
  },

  cookie: {
    name: process.env.COOKIE_NAME || "sf_refresh",
    secure: String(process.env.COOKIE_SECURE || "false") === "true",
  },

  fieldEncKeyBase64: process.env.FIELD_ENC_KEY_BASE64,
};

if (!env.mongoUri) throw new Error("Missing MONGO_URI");
if (!env.jwt.accessSecret) throw new Error("Missing JWT_ACCESS_SECRET");
if (!env.jwt.refreshSecret) throw new Error("Missing JWT_REFRESH_SECRET");
if (!env.fieldEncKeyBase64) throw new Error("Missing FIELD_ENC_KEY_BASE64");
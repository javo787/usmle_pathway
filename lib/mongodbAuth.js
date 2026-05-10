// lib/mongodbAuth.js
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const options = {};

let client;
let clientPromise;

// Фақат server-side да ишлайди — клиентда throw қилмаймиз
if (typeof window === "undefined") {
  if (!uri) {
    throw new Error("MONGODB_URI топилмади! Vercel Environment Variables га қўшинг.");
  }

  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }
} else {
  // Клиент томонида — бўш promise (NextAuth SSR да ишлатади)
  clientPromise = Promise.resolve(null);
}

export default clientPromise;

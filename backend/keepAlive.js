const { MongoClient } = require("mongodb");
require("dotenv").config();

const uri = process.env.DATABASE_URL;
const client = new MongoClient(uri);

async function keepAlive() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Ping enviado, cluster acordado!");
  } catch (err) {
    console.error("❌ Erro ao conectar:", err);
  } finally {
    await client.close();
  }
}

keepAlive();

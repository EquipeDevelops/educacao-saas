import { MongoClient } from "mongodb";

const uri = "sua_connection_string_aqui"; // pegue do Atlas
const client = new MongoClient(uri);

async function keepAlive() {
  try {
    await client.connect();
    // Apenas um ping rápido
    await client.db("admin").command({ ping: 1 });
    console.log("Ping enviado, cluster acordado!");
  } catch (err) {
    console.error("Erro ao conectar:", err);
  } finally {
    await client.close();
  }
}

// Executa agora
keepAlive();

// Opcional: repetir de tempos em tempos
setInterval(keepAlive, 1000 * 60 * 10); // a cada 10 min

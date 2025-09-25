import express from 'express';
import { Pool } from 'pg';
import amqp from 'amqplib';
import cors from 'cors';

const port = process.env.PORT;
const envs = ['dev', 'staging', 'prod'];

const app = express();
app.use(
  cors({
    origin: '*',
  })
);

const PG_URIS = envs.map(
  (env) => process.env[`POSTGRES_URI_${env.toUpperCase()}`]
);

const pools = PG_URIS.reduce((acc, uri, index) => {
  acc[envs[index]] = new Pool({
    connectionString: uri,
    ssl: { rejectUnauthorized: false },
  });
  return acc;
}, {} as { [key: string]: Pool });

app.get('/', (req, res) => {
  res.send({ message: 'Hello from the backend!' });
});

app.post('/:env/db', async (req, res) => {
  try {
    const env = req.params.env;
    if (!envs.includes(env)) {
      return res.status(400).send('Invalid environment');
    }
    const client = await pools[env].connect();
    const result = await client.query('SELECT NOW()');
    res.send(result.rows[0]);
    client.release();
  } catch (err) {
    console.error(err);
    res.status(500).send('Error connecting to the database');
  }
});

app.post('/:env/rabbitmq', async (req, res) => {
  try {
    const env = req.params.env;
    if (!envs.includes(env)) {
      return res.status(400).send('Invalid environment');
    }
    const connection = await amqp.connect(
      process.env[`RABBITMQ_URI_${env.toUpperCase()}`] || ''
    );
    const channel = await connection.createChannel();

    const { queue, msg } = req.query as { queue?: string; msg?: string };
    if (!queue || !msg) {
      return res
        .status(400)
        .send('Queue and msg query parameters are required');
    }

    await channel.assertQueue(queue, { durable: false });
    channel.sendToQueue(queue, Buffer.from(msg));
    res.send('Message sent to RabbitMQ');
    await channel.close();
    await connection.close();
  } catch (err) {
    console.error(err);
    res.status(500).send('Error connecting to RabbitMQ');
  }
});

app.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`);
});

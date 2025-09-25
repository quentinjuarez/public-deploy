import express from 'express';
import { Pool } from 'pg';
import amqp from 'amqplib';

const app = express();
const port = process.env.PORT;

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: 'postgres',
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: 5432,
});

app.get('/', (req, res) => {
  res.send({ message: 'Hello from the backend!' });
});

app.get('/db', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    res.send(result.rows[0]);
    client.release();
  } catch (err) {
    console.error(err);
    res.status(500).send('Error connecting to the database');
  }
});

app.get('/rabbitmq', async (req, res) => {
  try {
    const connection = await amqp.connect({
      protocol: 'amqp',
      hostname: 'rabbitmq',
      port: 5672,
      username: process.env.RABBITMQ_DEFAULT_USER,
      password: process.env.RABBITMQ_DEFAULT_PASS,
    });
    const channel = await connection.createChannel();
    const queue = 'hello';
    const msg = 'Hello World!';

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

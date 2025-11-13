import express from 'express';
import { Pool } from 'pg';
import amqp from 'amqplib';
import cors from 'cors';
import { getEnrichedCompanies, forceReleased, updateConfig } from './queries';

const port = process.env.PORT;
const envs = ['dev', 'staging', 'prod'];

const app = express();
app.use(express.json());
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

app.get('/:env/companies', async (req, res) => {
  try {
    const env = req.params.env;
    const filter = req.query.filter || 'client';
    if (!envs.includes(env)) {
      return res.status(400).send('Invalid environment');
    }
    const client = await pools[env].connect();
    const result = await client.query(
      getEnrichedCompanies(env, filter as 'client' | 'demo' | 'all')
    );
    res.send(result.rows);
    client.release();
  } catch (err) {
    console.error(err);
    res.status(500).send('Error connecting to the database');
  }
});

app.post('/:env/force-released', async (req, res) => {
  try {
    const env = req.params.env;
    if (!envs.includes(env)) {
      return res.status(400).send('Invalid environment');
    }

    const companyPublicConfigId = parseInt(
      req.body.companyPublicConfigId as string
    );
    if (isNaN(companyPublicConfigId)) {
      return res.status(400).send('Invalid or missing companyPublicConfigId');
    }

    const client = await pools[env].connect();
    const result = await client.query(forceReleased(companyPublicConfigId));
    res.send(result.rows);
    client.release();
  } catch (err) {
    console.error(err);
    res.status(500).send('Error connecting to the database');
  }
});

app.post('/:env/update-config', async (req, res) => {
  try {
    const env = req.params.env;
    if (!envs.includes(env)) {
      return res.status(400).send('Invalid environment');
    }

    const companyPublicConfigId = parseInt(
      req.body.companyPublicConfigId as string
    );
    const build_config = req.body.buildConfig;
    const ui_config = req.body.uiConfig;

    if (isNaN(companyPublicConfigId) || !build_config || !ui_config) {
      return res
        .status(400)
        .send(
          'Invalid or missing companyPublicConfigId, buildConfig or uiConfig'
        );
    }

    const client = await pools[env].connect();
    const result = await client.query(
      updateConfig.text,
      updateConfig.values(companyPublicConfigId, build_config, ui_config)
    );
    res.send(result.rows);
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

    const { queue, msg } = req.body as { queue?: string; msg?: any };
    if (!queue || !msg) {
      return res
        .status(400)
        .send('Queue and msg query parameters are required');
    }

    await channel.assertQueue(queue, { durable: true });
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(msg)));
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

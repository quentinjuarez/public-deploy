<template>
  <div class="min-h-screen bg-gray-100 text-gray-800">
    <div class="container mx-auto p-4">
      <h1 class="text-3xl font-bold mb-4">Dashboard</h1>

      <div class="flex border-b">
        <button
          v-for="env in envs"
          :key="env"
          class="px-4 py-2"
          :class="{
            'border-b-2 border-blue-500 text-blue-600': activeEnv === env,
            'text-gray-500': activeEnv !== env,
          }"
          @click="activeEnv = env"
        >
          {{ env.charAt(0).toUpperCase() + env.slice(1) }}
        </button>
      </div>

      <div class="mt-4">
        <div v-if="loading" class="text-center">Loading...</div>
        <div v-else>
          <div class="bg-white p-4 rounded shadow mb-4">
            <h2 class="text-xl font-semibold mb-2">PostgreSQL Data</h2>
            <pre class="bg-gray-200 p-2 rounded">{{ pgData }}</pre>
          </div>

          <div class="bg-white p-4 rounded shadow">
            <h2 class="text-xl font-semibold mb-2">Send RabbitMQ Message</h2>
            <div class="flex gap-2">
              <input
                v-model="rabbitmq.queue"
                type="text"
                placeholder="Queue"
                class="p-2 border rounded w-full"
              />
              <input
                v-model="rabbitmq.msg"
                type="text"
                placeholder="Message"
                class="p-2 border rounded w-full"
              />
              <button
                @click="sendRabbitMQMessage"
                class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Send
              </button>
            </div>
            <p v-if="rabbitmq.response" class="mt-2 text-green-500">
              {{ rabbitmq.response }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

type Env = 'dev' | 'staging' | 'prod';

const envs: Env[] = ['dev', 'staging', 'prod'];
const activeEnv = ref<Env>('dev');
const loading = ref(false);
const pgData = ref<string | null>(null);
const rabbitmq = ref({
  queue: '',
  msg: '',
  response: '',
});

const fetchData = async () => {
  loading.value = true;
  pgData.value = null;
  rabbitmq.value.response = '';
  try {
    const res = await fetch(
      `${process.env.BACKEND_URL}/${activeEnv.value}/db`,
      { method: 'POST' }
    );
    pgData.value = await res.json();
  } catch (err) {
    console.error(err);
    pgData.value = 'Error fetching data';
  } finally {
    loading.value = false;
  }
};

const sendRabbitMQMessage = async () => {
  try {
    const { queue, msg } = rabbitmq.value;
    const res = await fetch(
      `${process.env.BACKEND_URL}/${activeEnv.value}/rabbitmq?queue=${queue}&msg=${msg}`,
      { method: 'POST' }
    );
    rabbitmq.value.response = await res.text();
  } catch (err) {
    console.error(err);
    rabbitmq.value.response = 'Error sending message';
  }
};

watch(activeEnv, fetchData, { immediate: true });
</script>

<style scoped></style>

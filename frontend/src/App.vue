<template>
  <div class="min-h-screen bg-gray-100 text-gray-900">
    <div class="container mx-auto p-4">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-3xl font-bold">Dashboard</h1>
        <div class="flex items-center gap-2">
          <div class="text-sm text-gray-600">
            Environment:
            <span class="font-semibold text-blue-600">{{ activeEnv }}</span>
          </div>
          <button
            class="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 disabled:opacity-50 text-sm"
            :disabled="loading"
            @click="deployAll"
          >
            Deploy All
          </button>
          <button
            class="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 disabled:opacity-50 text-sm"
            :disabled="loading"
            @click="fetchData"
          >
            {{ loading ? 'Loading...' : 'Refresh' }}
          </button>
        </div>
      </div>

      <div class="flex border-b">
        <button
          v-for="env in envs"
          :key="env"
          class="px-4 py-2"
          :class="{
            'border-b-2 border-blue-500 text-blue-600': activeEnv === env,
            'text-gray-500': activeEnv !== env,
          }"
          @click="updateEnvAndHash(env)"
        >
          {{ env.charAt(0).toUpperCase() + env.slice(1) }}
        </button>
      </div>

      <div class="mt-4">
        <div v-if="loading" class="text-center py-8">
          <div
            class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"
          ></div>
          <div>Loading data for {{ activeEnv }}...</div>
        </div>
        <div
          v-else-if="pgData === 'Error fetching data'"
          class="text-center py-8 text-red-600"
        >
          <div class="text-xl font-semibold mb-2">Error Loading Data</div>
          <div class="mb-4">
            Failed to load data for {{ activeEnv }} environment
          </div>
          <button
            class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            @click="fetchData"
          >
            Retry
          </button>
        </div>
        <div
          v-else-if="!pgData || pgData.length === 0"
          class="text-center py-8 text-gray-600"
        >
          <div class="text-xl font-semibold mb-2">No Data Available</div>
          <div class="mb-4">
            No companies found in {{ activeEnv }} environment
          </div>
          <button
            class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            @click="fetchData"
          >
            Refresh
          </button>
        </div>
        <div v-else>
          <div class="bg-white p-4 rounded shadow mb-4">
            <h2 class="text-xl font-semibold mb-2">PostgreSQL Data</h2>
            <div
              v-for="(item, index) in pgData"
              :key="index"
              class="mb-2 w-full text-left"
            >
              <div
                class="bg-gray-100 p-2 rounded overflow-x-auto flex gap-2 items-center"
              >
                <img
                  :src="item.logo"
                  alt=""
                  class="w-32 h-16 object-cover rounded object-center"
                />

                <div class="mt-2">
                  <p><strong>ID:</strong> {{ item.id }}</p>
                  <p><strong>Name:</strong> {{ item.name }}</p>
                </div>
              </div>

              <table class="min-w-full bg-gray-50 rounded mb-2">
                <thead>
                  <tr>
                    <th class="px-2 py-1 text-left">Hostnames</th>
                    <th class="px-2 py-1 text-left">Deployment Status</th>
                    <th class="px-2 py-1 text-left">Last full deployment</th>
                    <th class="px-2 py-1 text-left">Builds</th>
                    <th class="px-2 py-1 text-left">Release</th>
                    <th class="px-2 py-1 text-left">Edit</th>
                    <th class="px-2 py-1 text-left">Widget</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(config, idx) in item.public_configs" :key="idx">
                    <td
                      class="px-2 py-1"
                      :class="{
                        'text-gray-500': !config.knowledge_id,
                      }"
                    >
                      {{
                        config.hostnames
                          ?.map((h: any) => h.hostname)
                          .join(', ') || 'N/A'
                      }}
                    </td>
                    <td class="px-2 py-1">
                      {{ config.deployment_statuses?.[0].deployment_status }}

                      <button
                        v-if="
                          config.deployment_statuses?.[0].deployment_status !==
                          'RELEASED'
                        "
                        class="ml-2 bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 text-xs"
                        @click="forceReleased(config.id)"
                      >
                        Force Release
                      </button>
                    </td>
                    <td class="px-2 py-1">
                      {{
                        config.deployment_statuses?.[0].updated_at
                          ? new Date(
                              config.deployment_statuses?.[0].updated_at
                            ).toLocaleString('fr-FR')
                          : 'N/A'
                      }}
                    </td>
                    <td class="px-2 py-1">
                      {{
                        config.deployment_statuses?.[0].public_config_build ||
                        'N/A'
                      }}
                    </td>
                    <td class="px-2 py-1 flex gap-2">
                      <button
                        v-for="action in ['full', 'embedded', 'widget', 'ask']"
                        class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-500 text-xs"
                        @click="handleAction(config.id, action)"
                      >
                        {{ action.charAt(0).toUpperCase() + action.slice(1) }}
                      </button>
                    </td>

                    <td class="px-2 py-1">
                      <button
                        class="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 text-xs"
                        @click="openEditModal(config.id)"
                      >
                        Edit
                      </button>
                    </td>

                    <td class="px-2 py-1">
                      <button
                        class="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 text-xs"
                        @click="openWidget(config.id)"
                      >
                        Widget
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Edit Modal -->
    <div
      v-if="showEditModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center"
      @mousedown.self="showEditModal = false"
    >
      <div class="bg-white p-6 rounded shadow-lg w-1/2">
        <h2 class="text-2xl font-bold mb-4">Edit Configuration</h2>

        <textarea
          v-if="focusConfig"
          class="w-full h-[20vh] p-2 border rounded mb-4 font-mono text-sm"
          v-model="uiConfig"
        >
        </textarea>

        <textarea
          v-if="focusConfig"
          class="w-full h-[50vh] p-2 border rounded mb-4 font-mono text-sm"
          v-model="buildConfig"
        >
        </textarea>

        <input
          type="text"
          class="w-full p-2 border rounded mb-4"
          v-model="focusConfig.knowledge_id"
          placeholder="Knowledge ID"
        />

        <input
          type="text"
          class="w-full p-2 border rounded mb-4"
          v-model="focusConfig.embedded_access_key"
          placeholder="Embedded Access Key"
        />

        <button
          class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          @click="handleSave"
        >
          Save
        </button>
      </div>
    </div>

    <!-- Widget - Backdrop - Testing -->
    <div
      v-if="showWidget"
      class="fixed inset-0 flex items-center justify-center z-50 bg-black/40"
      @mousedown.self="closeWidget"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useToast } from 'vue-toastification';

type Env = 'dev' | 'staging' | 'prod';

const envs: Env[] = ['dev', 'staging', 'prod'];
const activeEnv = ref<Env>('dev');
const loading = ref(false);
const pgData = ref<any | null>(null);
const toast = useToast();

// URL hash environment handling
const getEnvFromHash = (): Env => {
  const hash = window.location.hash.slice(1); // Remove #
  const params = new URLSearchParams(hash);
  const envFromHash = params.get('env') as Env;
  return envs.includes(envFromHash) ? envFromHash : 'dev';
};

const updateHashWithEnv = (env: Env) => {
  const hash = window.location.hash.slice(1);
  const params = new URLSearchParams(hash);
  params.set('env', env);
  window.location.hash = params.toString();
};

const fetchData = async () => {
  loading.value = true;
  pgData.value = null;
  try {
    const res = await fetch(
      `${process.env.BACKEND_URL}/${activeEnv.value}/companies?filter=all`,
      { method: 'GET' }
    );
    pgData.value = await res.json();
  } catch (err) {
    console.error(err);
    pgData.value = 'Error fetching data';
  } finally {
    loading.value = false;
  }
};

// Initialize environment from URL hash on load
const initializeEnv = () => {
  const envFromHash = getEnvFromHash();
  activeEnv.value = envFromHash;
  // Trigger initial data load
  fetchData();
};

// Watch for hash changes to update environment
const handleHashChange = () => {
  const envFromHash = getEnvFromHash();
  if (envFromHash !== activeEnv.value) {
    activeEnv.value = envFromHash;
  }
};

// Update hash when activeEnv changes
const updateEnvAndHash = (newEnv: Env) => {
  activeEnv.value = newEnv;
  updateHashWithEnv(newEnv);
};

const sendRabbitMQMessage = async (msg: any, queue: string) => {
  try {
    const response = await fetch(
      `${process.env.BACKEND_URL}/${activeEnv.value}/rabbitmq`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ msg, queue }),
      }
    );

    if (response.ok) {
      toast.success(`RabbitMQ message sent successfully to queue: ${queue}`);
    } else {
      toast.error('Failed to send RabbitMQ message');
    }
  } catch (err) {
    console.error(err);
    toast.error('Error sending RabbitMQ message');
  }
};

const handleAction = (configId: number, action: string) => {
  const msg = {
    company_public_config_id: configId,
    deployment_id: `qj-${new Date().getTime()}`,
    deployment_type: action,
  };
  const queue =
    action === 'full' ? 'selfcare-build' : 'selfcare-embedded-build';
  sendRabbitMQMessage(msg, queue);
  toast.info(`Initiated ${action} deployment for config ${configId}`);
};

const forceReleased = async (companyPublicConfigId: number) => {
  try {
    const res = await fetch(
      `${process.env.BACKEND_URL}/${activeEnv.value}/force-released`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyPublicConfigId }),
      }
    );
    const data = await res.json();
    console.log('Force released response:', data);

    await fetchData();
  } catch (err) {
    console.error('Error forcing release:', err);
  }
};

// EDIT MODAL
const showEditModal = ref(false);
const focusCompanyPublicConfigId = ref<number | null>(null);
const buildConfig = ref('');
const uiConfig = ref('');

const openEditModal = (companyPublicConfigId: number) => {
  focusCompanyPublicConfigId.value = companyPublicConfigId;
  buildConfig.value = JSON.stringify(focusConfig.value?.build_config, null, 2);
  uiConfig.value = JSON.stringify(focusConfig.value?.ui_config, null, 2);
  showEditModal.value = true;
};

const focusConfig = computed(() => {
  if (!pgData.value || !focusCompanyPublicConfigId.value) return null;

  for (const company of pgData.value) {
    const config = company.public_configs.find(
      (c: any) => c.id === focusCompanyPublicConfigId.value
    );
    if (config) return config;
  }
  return null;
});

const handleSave = async () => {
  if (!focusConfig.value) return;

  try {
    const res = await fetch(
      `${process.env.BACKEND_URL}/${activeEnv.value}/update-config`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyPublicConfigId: focusCompanyPublicConfigId.value,
          buildConfig: JSON.parse(buildConfig.value),
          uiConfig: JSON.parse(uiConfig.value),
        }),
      }
    );
    const data = await res.json();
    console.log('Update config response:', data);
    toast.success('Configuration updated successfully');
    showEditModal.value = false;
    await fetchData();
  } catch (err) {
    console.error('Error updating config:', err);
    toast.error('Error updating configuration');
  }
};

onMounted(() => {
  // Initialize environment from URL hash
  initializeEnv();

  // Add hash change listener
  window.addEventListener('hashchange', handleHashChange);

  // Add escape key listener for modal
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && showEditModal.value) {
      showEditModal.value = false;
    }
  });

  window.addEventListener('MdSelfcareLoaded', (e: Event) => {
    const customEvent = e as CustomEvent;
    window.__MAYDAY_SELFCARE__ = customEvent.detail;
    // 'init' is a md-selfcare function that init accessKey and locale in the store
    window.__MAYDAY_SELFCARE__.init({
      accessKey: focusConfig.value?.embedded_access_key,
    });
  });
});

const deployAll = async () => {
  if (!pgData.value) return;

  const actions = ['full', 'embedded', 'widget', 'ask'];

  const configsWithKnowledgeId = pgData.value
    .flatMap((company: any) => company.public_configs)
    .filter((config: any) => config.knowledge_id);

  for (const config of configsWithKnowledgeId) {
    for (const action of actions) {
      handleAction(config.id, action);
      // Adding a small delay to avoid overwhelming the backend
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  toast.success(
    `Deployed all configurations for ${configsWithKnowledgeId.length} configs`
  );
};

watch(activeEnv, fetchData);

// WIDGET TESTING
const showWidget = ref(false);

const openWidget = (configId: number) => {
  focusCompanyPublicConfigId.value = configId;

  const hostname = focusConfig.value?.hostnames?.[0]?.hostname;

  const scriptUrl = `https://${hostname}/widget/md-selfcare.umd.js`;

  const scriptEl = document.createElement('script');
  scriptEl.setAttribute('src', scriptUrl);
  document.body.append(scriptEl);

  showWidget.value = true;
};

const closeWidget = () => {
  window.location.reload();
};
</script>

<style scoped></style>

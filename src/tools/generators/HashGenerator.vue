<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Hash, Sparkles } from 'lucide-vue-next';
import ToolContainer from '../../components/common/ToolContainer.vue';
import TextEditorBox from '../../components/common/TextEditorBox.vue';
import CopyButton from '../../components/common/CopyButton.vue';
import { md5 } from '../../utils/md5';

const { t } = useI18n();

const inputText = ref('');
const uppercase = ref(false);

interface HashResult {
  algo: string;
  value: string;
}

const hashes = ref<HashResult[]>([
  { algo: 'MD5', value: '' },
  { algo: 'SHA-1', value: '' },
  { algo: 'SHA-256', value: '' },
  { algo: 'SHA-384', value: '' },
  { algo: 'SHA-512', value: '' },
]);

async function computeSubtleHash(algorithm: string, text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function computeAllHashes() {
  if (!inputText.value) {
    hashes.value.forEach(h => (h.value = ''));
    return;
  }

  const text = inputText.value;

  // MD5
  let md5Val = md5(text);
  if (uppercase.value) md5Val = md5Val.toUpperCase();

  // Web Crypto (SHA-1, SHA-256, SHA-384, SHA-512)
  const [sha1, sha256, sha384, sha512] = await Promise.all([
    computeSubtleHash('SHA-1', text),
    computeSubtleHash('SHA-256', text),
    computeSubtleHash('SHA-384', text),
    computeSubtleHash('SHA-512', text),
  ]);

  const format = (v: string) => (uppercase.value ? v.toUpperCase() : v.toLowerCase());

  hashes.value = [
    { algo: 'MD5', value: format(md5Val) },
    { algo: 'SHA-1', value: format(sha1) },
    { algo: 'SHA-256', value: format(sha256) },
    { algo: 'SHA-384', value: format(sha384) },
    { algo: 'SHA-512', value: format(sha512) },
  ];
}

function loadSample() {
  inputText.value = 'Hello DevCrate! 现代开发者工具箱';
}

watch([inputText, uppercase], () => {
  computeAllHashes();
});

onMounted(() => {
  loadSample();
});
</script>

<template>
  <ToolContainer
    toolId="hash-generator"
    nameKey="tools.hashGenerator.name"
    descKey="tools.hashGenerator.desc"
    :icon="Hash"
  >
    <!-- 输入文本框 -->
    <div class="flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <label class="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          {{ t('common.input') }}
        </label>
        <div class="flex items-center gap-4">
          <label class="inline-flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
            <input
              type="checkbox"
              v-model="uppercase"
              class="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span>{{ t('tools.hashGenerator.uppercase') }}</span>
          </label>

          <button
            type="button"
            @click="loadSample"
            class="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            <Sparkles class="w-3.5 h-3.5" />
            <span>{{ t('common.loadSample') }}</span>
          </button>
        </div>
      </div>

      <TextEditorBox
        v-model="inputText"
        :rows="4"
        placeholder="Type or paste text to compute hashes..."
        @clear="computeAllHashes"
      />
    </div>

    <!-- 哈希计算结果列表 -->
    <div class="flex flex-col gap-3">
      <h3 class="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {{ t('common.output') }}
      </h3>

      <div class="flex flex-col gap-2.5">
        <div
          v-for="item in hashes"
          :key="item.algo"
          class="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div class="flex flex-col gap-1 min-w-0 flex-1">
            <div class="text-xs font-semibold text-blue-600 dark:text-blue-400">
              {{ item.algo }}
            </div>
            <div class="font-mono text-xs text-zinc-800 dark:text-zinc-200 break-all select-all">
              {{ item.value || '-' }}
            </div>
          </div>

          <div class="shrink-0 self-end sm:self-center">
            <CopyButton :text="item.value" variant="secondary" />
          </div>
        </div>
      </div>
    </div>
  </ToolContainer>
</template>

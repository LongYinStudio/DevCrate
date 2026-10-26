<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Fingerprint, RefreshCw, KeyRound } from 'lucide-vue-next';
import ToolContainer from '../../components/common/ToolContainer.vue';
import CopyButton from '../../components/common/CopyButton.vue';
import TextEditorBox from '../../components/common/TextEditorBox.vue';

const { t } = useI18n();

// UUID 状态
const count = ref(5);
const uppercase = ref(false);
const hyphens = ref(true);
const generatedUuids = ref<string[]>([]);
const uuidsText = ref('');

// 随机字符状态
const strLength = ref(24);
const includeUppercase = ref(true);
const includeLowercase = ref(true);
const includeDigits = ref(true);
const includeSymbols = ref(true);
const generatedRandomStr = ref('');

function generateUuid(): string {
  // 浏览器原生 Web Crypto
  let uuid: string = crypto.randomUUID();
  if (!hyphens.value) {
    uuid = uuid.replace(/-/g, '');
  }
  if (uppercase.value) {
    uuid = uuid.toUpperCase();
  }
  return uuid;
}

function handleGenerateUuids() {
  const result: string[] = [];
  const total = Math.min(Math.max(count.value, 1), 100);
  for (let i = 0; i < total; i++) {
    result.push(generateUuid());
  }
  generatedUuids.value = result;
  uuidsText.value = result.join('\n');
}

function handleGenerateRandomString() {
  let chars = '';
  if (includeUppercase.value) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (includeLowercase.value) chars += 'abcdefghijklmnopqrstuvwxyz';
  if (includeDigits.value) chars += '0123456789';
  if (includeSymbols.value) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (!chars) {
    generatedRandomStr.value = '';
    return;
  }

  const array = new Uint32Array(strLength.value);
  crypto.getRandomValues(array);
  let res = '';
  for (let i = 0; i < strLength.value; i++) {
    res += chars[array[i] % chars.length];
  }
  generatedRandomStr.value = res;
}

onMounted(() => {
  handleGenerateUuids();
  handleGenerateRandomString();
});
</script>

<template>
  <ToolContainer
    toolId="uuid-generator"
    nameKey="tools.uuidGenerator.name"
    descKey="tools.uuidGenerator.desc"
    :icon="Fingerprint"
  >
    <!-- UUID 生成模块 -->
    <div class="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col gap-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2 font-medium text-sm text-zinc-900 dark:text-zinc-100">
          <Fingerprint class="w-4 h-4 text-blue-500" />
          <span>UUID v4 (RFC 4122)</span>
        </div>

        <button
          type="button"
          @click="handleGenerateUuids"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer"
        >
          <RefreshCw class="w-3.5 h-3.5" />
          <span>{{ t('tools.uuidGenerator.generate') }}</span>
        </button>
      </div>

      <!-- 参数配置选项 -->
      <div class="flex flex-wrap items-center gap-5 text-xs text-zinc-700 dark:text-zinc-300 pt-2 border-t border-zinc-100 dark:border-zinc-800">
        <div class="flex items-center gap-2">
          <span>{{ t('tools.uuidGenerator.count') }}:</span>
          <input
            v-model.number="count"
            type="number"
            min="1"
            max="100"
            class="w-16 px-2 py-1 rounded-md text-xs font-mono bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none"
          />
        </div>

        <label class="inline-flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            v-model="uppercase"
            @change="handleGenerateUuids"
            class="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <span>{{ t('tools.uuidGenerator.uppercase') }}</span>
        </label>

        <label class="inline-flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            v-model="hyphens"
            @change="handleGenerateUuids"
            class="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <span>{{ t('tools.uuidGenerator.hyphens') }}</span>
        </label>
      </div>

      <!-- 结果列表展示 -->
      <TextEditorBox
        v-model="uuidsText"
        :label="t('common.output')"
        :readonly="true"
        :rows="6"
        :showPaste="false"
        :showClear="false"
      />
    </div>

    <!-- 随机字符串与密码生成器模块 -->
    <div class="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col gap-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2 font-medium text-sm text-zinc-900 dark:text-zinc-100">
          <KeyRound class="w-4 h-4 text-emerald-500" />
          <span>{{ t('tools.uuidGenerator.randomString') }}</span>
        </div>

        <button
          type="button"
          @click="handleGenerateRandomString"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
        >
          <RefreshCw class="w-3.5 h-3.5" />
          <span>{{ t('tools.uuidGenerator.generate') }}</span>
        </button>
      </div>

      <!-- 配置项 -->
      <div class="flex flex-wrap items-center gap-4 text-xs text-zinc-700 dark:text-zinc-300 pt-2 border-t border-zinc-100 dark:border-zinc-800">
        <div class="flex items-center gap-2">
          <span>{{ t('tools.uuidGenerator.length') }}:</span>
          <input
            v-model.number="strLength"
            type="number"
            min="4"
            max="128"
            class="w-16 px-2 py-1 rounded-md text-xs font-mono bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none"
          />
        </div>

        <label class="inline-flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            v-model="includeUppercase"
            @change="handleGenerateRandomString"
            class="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <span>A-Z</span>
        </label>

        <label class="inline-flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            v-model="includeLowercase"
            @change="handleGenerateRandomString"
            class="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <span>a-z</span>
        </label>

        <label class="inline-flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            v-model="includeDigits"
            @change="handleGenerateRandomString"
            class="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <span>0-9</span>
        </label>

        <label class="inline-flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            v-model="includeSymbols"
            @change="handleGenerateRandomString"
            class="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <span>{{ t('tools.uuidGenerator.includeSymbols') }}</span>
        </label>
      </div>

      <!-- 结果卡片展示 -->
      <div class="flex items-center justify-between p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
        <div class="font-mono text-sm font-semibold tracking-wider text-zinc-800 dark:text-zinc-100 break-all select-all">
          {{ generatedRandomStr }}
        </div>
        <CopyButton :text="generatedRandomStr" variant="secondary" />
      </div>
    </div>
  </ToolContainer>
</template>

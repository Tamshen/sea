<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue';
import type { ConfigEngine } from '@/nav-data';
import { buildSearchUrl, loadHistory, addHistory, removeHistory, clearHistory } from '@/nav-data';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Icon } from '@iconify/vue';

const props = defineProps<{
  engines: ConfigEngine[];
  modelValue: string;
  newTab: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'update:focused': [value: boolean];
}>();

const query = ref('');
const suggestions = ref<string[]>([]);
const showSugs = ref(false);
const activeIndex = ref(-1);
const originalQuery = ref('');
const isFocused = ref(false);
const isHistory = ref(false);
let sugTimeout: ReturnType<typeof setTimeout> | null = null;
let currentScript: HTMLScriptElement | null = null;

const currentEngine = computed(() =>
  props.engines.find((e) => e.name === props.modelValue) ?? props.engines[0]
);

const sortedEngines = computed(() =>
  [...props.engines].sort((a, b) => b.order - a.order)
);

function doSearch(q?: string) {
  const text = (q ?? query.value).trim();
  if (!text) return;
  addHistory(text);
  const url = buildSearchUrl(currentEngine.value?.url ?? props.engines[0]?.url, text);
  if (props.newTab) {
    window.open(url, '_blank');
  } else {
    window.location.href = url;
  }
}

function showHistoryList() {
  const list = loadHistory();
  if (list.length > 0) {
    suggestions.value = list;
    showSugs.value = true;
    isHistory.value = true;
    activeIndex.value = -1;
  }
}

function fetchSuggestions() {
  const text = query.value.trim();
  if (!text) {
    suggestions.value = [];
    showSugs.value = false;
    activeIndex.value = -1;
    return;
  }

  if (currentScript) {
    document.head.removeChild(currentScript);
    currentScript = null;
  }

  const script = document.createElement('script');
  script.src = `https://suggestion.baidu.com/su?wd=${encodeURIComponent(text)}&cb=window.__bdSugCallback`;
  currentScript = script;

  (window as any).__bdSugCallback = (json: { s: string[] }) => {
    suggestions.value = json.s || [];
    showSugs.value = suggestions.value.length > 0;
    isHistory.value = false;
    activeIndex.value = -1;
    if (currentScript) {
      document.head.removeChild(currentScript);
      currentScript = null;
    }
    delete (window as any).__bdSugCallback;
  };

  document.head.appendChild(script);
}

function onInput() {
  if (sugTimeout) clearTimeout(sugTimeout);
  activeIndex.value = -1;

  const text = query.value.trim();
  if (!text) {
    suggestions.value = [];
    showSugs.value = false;
    showHistoryList();
    return;
  }

  originalQuery.value = text;
  isHistory.value = false;
  sugTimeout = setTimeout(() => {
    fetchSuggestions();
  }, 80);
}

function onKeydown(e: KeyboardEvent) {
  if (!showSugs.value || suggestions.value.length === 0) {
    if (e.key === 'Enter') {
      e.preventDefault();
      doSearch();
    }
    return;
  }

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      activeIndex.value++;
      if (activeIndex.value >= suggestions.value.length) {
        activeIndex.value = 0;
      }
      query.value = suggestions.value[activeIndex.value];
      break;
    case 'ArrowUp':
      e.preventDefault();
      activeIndex.value--;
      if (activeIndex.value < 0) {
        activeIndex.value = suggestions.value.length - 1;
      }
      query.value = suggestions.value[activeIndex.value];
      break;
    case 'Enter':
      e.preventDefault();
      if (activeIndex.value >= 0) {
        doSearch(suggestions.value[activeIndex.value]);
      } else {
        doSearch();
      }
      showSugs.value = false;
      break;
    case 'Escape':
      e.preventDefault();
      if (!isHistory.value) {
        query.value = originalQuery.value;
      }
      activeIndex.value = -1;
      showSugs.value = false;
      break;
  }
}

function onSugClick(text: string) {
  query.value = text;
  showSugs.value = false;
  activeIndex.value = -1;
  doSearch(text);
}

function removeItem(text: string) {
  removeHistory(text);
  suggestions.value = loadHistory();
  if (suggestions.value.length === 0) {
    showSugs.value = false;
  }
}

function clearAllHistory() {
  clearHistory();
  suggestions.value = [];
  showSugs.value = false;
}

function onFocus() {
  isFocused.value = true;
  emit('update:focused', true);
  if (!query.value.trim()) {
    showHistoryList();
  }
}

function onBlur() {
  setTimeout(() => {
    if (!query.value.trim()) {
      isFocused.value = false;
      emit('update:focused', false);
    }
    showSugs.value = false;
  }, 150);
}

onBeforeUnmount(() => {
  if (sugTimeout) clearTimeout(sugTimeout);
  if (currentScript && currentScript.parentNode) {
    currentScript.parentNode.removeChild(currentScript);
  }
});
</script>

<template>
  <div class="relative z-50">
    <!-- 搜索框 -->
    <div class="flex items-center w-full max-w-2xl relative">
      <div class="bg-white rounded-l px-4 flex items-center text-gray-600 text-sm font-medium select-none h-11 shrink-0">
        搜索
      </div>
      <div class="relative flex-1">
        <Input
          v-model="query"
          type="text"
          placeholder=""
          class="rounded-none border-0 border-y border-r bg-white !h-11 px-3 pr-8 text-gray-800 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-gray-200 w-full"
          @input="onInput"
          @keydown="onKeydown"
          @focus="onFocus"
          @blur="onBlur"
        />
        <button
          v-if="query"
          type="button"
          class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
          @mousedown.prevent="query = ''; onInput()"
        >
          <Icon icon="carbon:close" class="size-4" />
        </button>

        <!-- 下拉列表（候选词 / 历史记录） -->
        <div
          v-if="showSugs"
          class="absolute top-full left-0 mt-1 w-full bg-white rounded-lg shadow-md border z-50 overflow-hidden"
        >
          <div v-if="isHistory" class="px-4 py-1.5 text-xs text-gray-400 border-b bg-gray-50">历史记录</div>
          <div
            v-for="(item, index) in suggestions"
            :key="index"
            class="px-4 py-2 text-sm cursor-pointer transition-colors flex items-center gap-2"
            :class="index === activeIndex ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'"
            @mousedown.prevent="onSugClick(item)"
          >
            <Icon v-if="isHistory" icon="carbon:time" class="size-3.5 shrink-0" :class="index === activeIndex ? 'text-white' : 'text-gray-400'" />
            <span class="truncate">{{ item }}</span>
            <button
              v-if="isHistory"
              type="button"
              class="ml-auto p-0.5 rounded hover:bg-black/10 shrink-0"
              :class="index === activeIndex ? 'text-white hover:bg-white/20' : 'text-gray-400'"
              @mousedown.stop.prevent="removeItem(item)"
            >
              <Icon icon="carbon:close" class="size-3.5" />
            </button>
          </div>
          <div v-if="isHistory && suggestions.length > 0" class="px-4 py-1.5 border-t bg-gray-50 text-center">
            <button
              type="button"
              class="text-xs text-gray-500 hover:text-red-500 transition-colors"
              @mousedown.prevent="clearAllHistory"
            >
              清空全部历史记录
            </button>
          </div>
        </div>
      </div>

      <Select :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
        <SelectTrigger
          class="rounded-none border-0 border-y border-r bg-white !h-11 px-3 text-gray-600 focus:ring-0 focus:ring-offset-0 focus-visible:border-gray-200 [&_svg]:text-gray-600 w-28 justify-between shrink-0"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="engine in sortedEngines"
            :key="engine.name"
            :value="engine.name"
          >
            {{ engine.name }}
          </SelectItem>
        </SelectContent>
      </Select>

      <Button
        class="rounded-l-none !h-11 px-6 bg-blue-500 hover:bg-blue-600 text-white border-0 shrink-0"
        @click="doSearch()"
      >
        搜索
      </Button>
    </div>

  </div>
</template>

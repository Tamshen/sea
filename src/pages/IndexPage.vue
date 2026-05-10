<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { defaultConfig } from '@/nav-data';
import type { AppConfig } from '@/nav-data';
import { useConfig } from '@/composables/useConfig';
import { getLocation } from '@/composables/useLocation';
import AppHeader from '@/components/layout/AppHeader.vue';
import SearchBox from '@/components/search/SearchBox.vue';
import QuickLinks from '@/components/quicklinks/QuickLinks.vue';
import SettingsDialog from '@/components/settings/SettingsDialog.vue';
import LineAnimation from '@/components/background/LineAnimation.vue';

const { config, setConfig, updateEngineOrder } = useConfig();
const currentEngineKey = ref(config.value.engine[0]?.name ?? '');
const appVersion = __APP_VERSION__;
const settingOpen = ref(false);
const searchFocused = ref(false);
const bgAngle = ref(180);
const quickLinksEditMode = ref(false);

function applyConfig() {
  document.title = config.value.title || defaultConfig.title;
  applyCustomCss();
}

function applyCustomCss() {
  let style = document.getElementById('legendink-custom-css') as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = 'legendink-custom-css';
    document.head.appendChild(style);
  }
  const bgCss = config.value.bg
    ? `body { background-image: url(${config.value.bg}); background-size: cover; background-position: center; }`
    : '';
  style.textContent = (config.value.customCss || '') + '\n' + bgCss;
}

function rotateBg() {
  bgAngle.value += 45;
}

function onSaveSettings(newConfig: AppConfig) {
  setConfig(newConfig);
  if (!config.value.engine.find((e) => e.name === currentEngineKey.value)) {
    currentEngineKey.value = config.value.engine[0]?.name ?? '';
  }
  applyConfig();
}

watch(currentEngineKey, (newVal, oldVal) => {
  if (!oldVal) return;
  updateEngineOrder(newVal);
});

onMounted(() => {
  applyConfig();
  getLocation();
});
</script>

<template>
  <div
    class="min-h-screen relative overflow-hidden"
    :style="{
      '--bg-angle': `${bgAngle}deg`,
      background: 'linear-gradient(var(--bg-angle), #0ea5e9, #06b6d4)',
      transition: '--bg-angle 0.8s linear',
    }"
    @click.self="rotateBg"
  >
    <LineAnimation v-if="config.show_line_animation !== false" />

    <AppHeader
      :title="config.title"
      :show-poem="config.show_poem !== false"
      :quick-links-edit-mode="quickLinksEditMode"
      @open-settings="settingOpen = true"
      @toggle-quick-links-edit="quickLinksEditMode = !quickLinksEditMode"
    />

    <!-- 遮罩层 -->
    <div
      v-show="searchFocused"
      class="fixed inset-0 bg-black/30 z-40 transition-opacity duration-500"
      @click="searchFocused = false"
    />

    <!-- Main Search Area -->
    <main class="flex flex-col items-center justify-center pt-24 px-4 relative z-50">
      <SearchBox
        :engines="config.engine"
        v-model="currentEngineKey"
        :new-tab="config.new_tab"
        @update:focused="searchFocused = $event"
      />

      <QuickLinks :global-new-tab="config.new_tab" v-model:edit-mode="quickLinksEditMode" />
    </main>

    <SettingsDialog
      :config="config"
      :open="settingOpen"
      @update:open="settingOpen = $event"
      @save="onSaveSettings"
    />

    <!-- Version -->
    <div class="absolute bottom-3 left-4 text-xs text-white/60 select-none">
      v{{ appVersion }}
    </div>
  </div>
</template>

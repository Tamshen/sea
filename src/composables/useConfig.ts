import { ref } from 'vue';
import {
  loadConfig,
  saveConfig,
  defaultConfig,
} from '@/nav-data';
import type { AppConfig } from '@/nav-data';

const config = ref<AppConfig>(loadConfig());

export function useConfig() {
  function setConfig(newConfig: AppConfig) {
    config.value = newConfig;
    saveConfig(newConfig);
  }

  function patchConfig(partial: Partial<AppConfig>) {
    config.value = { ...config.value, ...partial };
    saveConfig(config.value);
  }

  function updateEngineOrder(engineName: string) {
    if (!config.value.remember_engine) return;
    const engine = config.value.engine.find((e) => e.name === engineName);
    if (!engine) return;
    const maxOrder = Math.max(...config.value.engine.map((e) => e.order));

    if (engine.order < maxOrder) {
      engine.order = Math.min(maxOrder + 1, 999);
    } else if (engine.order === 999) {
      // 已经是999且并列第一，降低其他同为999的引擎
      config.value.engine.forEach((e) => {
        if (e.name !== engineName && e.order === 999) {
          e.order = 998;
        }
      });
    } else {
      return;
    }

    config.value.engine.sort((a, b) => b.order - a.order);
    saveConfig(config.value);
  }

  return {
    config,
    setConfig,
    patchConfig,
    updateEngineOrder,
  };
}

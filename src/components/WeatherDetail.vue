<script setup lang="ts">
import { computed } from 'vue';
import type { WeatherAll } from '@/composables/useWeather';

const props = withDefaults(defineProps<{
  location: { province: string; city: string; adcode: string } | null;
  weatherData: WeatherAll | null;
  showHeader?: boolean;
}>(), {
  showHeader: true,
});

const live = computed(() => props.weatherData?.lives?.[0]);
const forecast = computed(() => props.weatherData?.forecasts?.[0]);
const casts = computed(() => forecast.value?.casts || []);

const weekMap: Record<string, string> = {
  '1': '周一',
  '2': '周二',
  '3': '周三',
  '4': '周四',
  '5': '周五',
  '6': '周六',
  '7': '周日',
};

function formatWeek(week: string): string {
  return weekMap[week] || week;
}

function formatDate(dateStr: string): string {
  const parts = dateStr.split('-');
  return parts.length === 3 ? `${parts[1]}-${parts[2]}` : dateStr;
}
</script>

<template>
  <div>

    <div v-if="showHeader" class="bg-gradient-to-br from-sky-400 to-blue-500 text-white p-4">
      <div v-if="showHeader" class="flex items-baseline justify-between">
        <div class="text-base font-medium">
          {{ location ? (location.province === location.city ? location.city : `${location.province} · ${location.city}`) : '天气' }}
        </div>
        <div v-if="live?.reporttime" class="text-[10px] text-white/60">
          更新于 {{ live.reporttime }}
        </div>
      </div>

      <div v-if="live" class="flex items-end gap-2" :class="showHeader ? 'mt-3' : ''">
        <span class="text-4xl font-light tracking-tighter">{{ live.temperature }}</span>
        <span class="text-xl font-light mb-0.5">°C</span>
        <span class="text-base mb-0.5 ml-1">{{ live.weather }}</span>
      </div>

      <div v-if="live" class="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-white/75">
        <span>湿度 {{ live.humidity }}%</span>
        <span>{{ live.winddirection }}风 {{ live.windpower }}级</span>
      </div>
    </div>

    <div v-if="casts.length > 0" class="p-3 bg-background">
      <div class="space-y-2">
        <div
          v-for="(cast, index) in casts"
          :key="index"
          class="flex items-center justify-between text-xs"
        >
          <div class="w-14 shrink-0">
            <div class="font-medium">{{ index === 0 ? '今天' : formatWeek(cast.week) }}</div>
            <div class="text-[10px] text-muted-foreground">{{ formatDate(cast.date) }}</div>
          </div>
          <div class="flex-1 text-center">
            <span class="text-[11px] text-muted-foreground">{{ cast.dayweather === cast.nightweather ? cast.dayweather : `${cast.dayweather}转${cast.nightweather}` }}</span>
          </div>
          <div class="w-16 text-right shrink-0">
            <span class="font-medium">{{ cast.daytemp }}°</span>
            <span class="text-muted-foreground"> / {{ cast.nighttemp }}°</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

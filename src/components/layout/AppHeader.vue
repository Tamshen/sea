<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/vue';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { getLocation } from '@/composables/useLocation';
import { getWeather, getWeatherAll } from '@/composables/useWeather';
import type { WeatherAll } from '@/composables/useWeather';
import WeatherDetail from '@/components/WeatherDetail.vue';

const props = defineProps<{
  title: string;
  showPoem?: boolean;
  quickLinksEditMode?: boolean;
}>();

const emit = defineEmits<{
  openSettings: [];
  toggleQuickLinksEdit: [];
}>();

const weatherDialogOpen = ref(false);
const weatherAll = ref<WeatherAll | null>(null);
const weatherLoading = ref(false);

const poems = [
  '前不见古人，后不见来者。念天地之悠悠，独怆然而涕下。——陈子昂《登幽州台歌》',
  '世事一场大梦，人生几度秋凉？——苏轼《西江月》',
  '疏影横斜，远映西湖清浅；暗香浮动，长陪夜月黄昏。——张岱《陶庵梦忆》',
  '回头万里，故人长绝，满座衣冠胜雪。——辛弃疾《贺新郎·别茂嘉十二弟》',
  '世界微尘里，吾宁爱与憎。——李商隐《北青萝》',
  '夜阑卧听风吹雨，铁马冰河入梦来。——陆游《十一月四日风雨大作》',
  '我醉欲眠卿且去，明朝有意抱琴来。——李白《山中与幽人对酌》',
  '春风得意马蹄疾，一日看尽长安花。——孟郊《登科后》',
  '近乡情更怯，不敢问来人。——宋之问《渡汉江》',
  '在天愿作比翼鸟，在地愿为连理枝。天长地久有时尽，此恨绵绵无绝期。——白居易《长恨歌》',
  '人面不知何处去，桃花依旧笑春风。——崔护《题都城南庄》',
  '不如意事常八九，可与语人无二三。——方岳《别子才司令》',
  '忽如一夜春风来，千树万树梨花开。——岑参《白雪歌送武判官归京》',
  '此去经年，应是良辰好景虚设。便纵有千种风情，更与何人说？——柳永《雨霖铃·寒蝉凄切》',
  '此情无计可消除，才下眉头，却上心头。——李清照《一剪梅·红藕香残玉簟秋》',
  '剪不断，理还乱，是离愁。别是一般滋味在心头。——李煜《相见欢·无言独上西楼》',
  '明月高楼休独倚。酒入愁肠，化作相思泪。——范仲淹《苏幕遮·怀旧》',
  '落霞与孤鹜齐飞，秋水共长天一色。老当益壮，宁移白首之心？穷且益坚，不坠青云之志。——王勃《滕王阁序》',
  '沾衣欲湿杏花雨，吹面不寒杨柳风。——志南',
  '柴门闻犬吠，风雪夜归人。——刘长卿《逢雪宿芙蓉山主人》',
  '别后相思空一水，重来回首已三生。——黄景仁《感旧》',
  '得成比目何辞死，愿做鸳鸯不羡仙。——卢照邻《长安古意》',
  '人生自是有情痴，此恨不关风和月。——欧阳修《玉楼春》',
  '物是人非事事休——李清照《武陵春·春晚》',
  '花开堪折直须折，莫待无花空折枝。——《金缕衣》',
  '往事越千年，魏武挥鞭，东临碣石有遗篇。萧瑟秋风今又是，换了人间。——毛泽东《浪淘沙·北戴河》',
];

const displayText = ref('');
const location = ref<{ province: string; city: string; adcode: string } | null>(null);
const weather = ref<{ weather: string; temperature: string } | null>(null);
let timer: ReturnType<typeof setTimeout> | null = null;
let currentPoem = '';
let charIndex = 0;
let phase: 'typing' | 'waiting' | 'deleting' = 'typing';

function pickRandomPoem() {
  const next = poems[Math.floor(Math.random() * poems.length)];
  if (next === currentPoem && poems.length > 1) return pickRandomPoem();
  return next;
}

function tick() {
  if (timer) clearTimeout(timer);
  if (props.title !== 'New Tab' || props.showPoem === false) return;

  if (phase === 'typing') {
    if (charIndex < currentPoem.length) {
      displayText.value = currentPoem.slice(0, charIndex + 1);
      charIndex++;
      timer = setTimeout(tick, 70 + Math.random() * 60);
    } else {
      phase = 'waiting';
      timer = setTimeout(tick, 4500);
    }
  } else if (phase === 'waiting') {
    phase = 'deleting';
    tick();
  } else if (phase === 'deleting') {
    if (charIndex > 0) {
      charIndex--;
      displayText.value = currentPoem.slice(0, charIndex);
      timer = setTimeout(tick, 35 + Math.random() * 25);
    } else {
      currentPoem = pickRandomPoem();
      phase = 'typing';
      timer = setTimeout(tick, 400);
    }
  }
}

function start() {
  if (props.title !== 'New Tab' || props.showPoem === false) return;
  currentPoem = pickRandomPoem();
  charIndex = 0;
  phase = 'typing';
  displayText.value = '';
  tick();
}

watch(() => [props.title, props.showPoem], ([newTitle, newShow]) => {
  if (newTitle === 'New Tab' && newShow !== false) {
    start();
  } else {
    if (timer) clearTimeout(timer);
    displayText.value = '';
  }
});

onMounted(() => {
  if (props.title === 'New Tab' && props.showPoem !== false) start();
  getLocation().then((data) => {
    if (data && typeof data === 'object') {
      const loc = data as { province: string; city: string; adcode: string };
      location.value = loc;
      if (loc.adcode) {
        getWeather(loc.adcode).then((w) => {
          if (w) weather.value = w;
        });
      }
    }
  });
});

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer);
});

async function loadWeatherAll() {
  if (!location.value?.adcode || weatherAll.value || weatherLoading.value) return;
  weatherLoading.value = true;
  const data = await getWeatherAll(location.value.adcode);
  if (data) weatherAll.value = data;
  weatherLoading.value = false;
}

function openWeatherDialog() {
  weatherDialogOpen.value = true;
  loadWeatherAll();
}
</script>

<template>
  <header class="flex items-center justify-between px-4 sm:px-6 py-4 text-white/90 gap-4">
    <div class="flex items-center gap-3 min-w-0">
      <Icon icon="carbon:earth-southeast-asia" class="size-8 shrink-0 text-white/90" />
      <div class="text-xs sm:text-sm tracking-wider opacity-90 leading-tight min-w-0 line-clamp-2">
        <template v-if="title === 'New Tab' && showPoem !== false">
          <span>{{ displayText }}</span>
          <span class="inline-block w-0.5 h-3.5 sm:h-4 ml-0.5 bg-white/80 align-middle type-cursor" />
        </template>
        <template v-else>{{ title }}</template>
      </div>
    </div>
    <div class="flex items-center gap-3 shrink-0">
      <span
        v-if="weather"
        class="text-xs opacity-80 cursor-pointer hover:opacity-100 transition-opacity hidden sm:inline"
        @click="openWeatherDialog"
        >{{ weather.weather }} {{ weather.temperature }}°C</span
      >
      <span
        v-else-if="location"
        class="text-xs opacity-80 cursor-pointer hover:opacity-100 transition-opacity hidden sm:inline"
        @click="openWeatherDialog"
      >
        {{ location.province === location.city ? location.province : location.province + ' · ' + location.city }}
      </span>

      <Dialog :open="weatherDialogOpen" @update:open="weatherDialogOpen = $event">
        <DialogContent class="w-80 max-h-[90vh] p-0 overflow-hidden flex flex-col rounded-xl gap-0 border-0 shadow-2xl">
          <DialogHeader class="shrink-0 px-4 pt-4 pb-2">
            <DialogTitle>天气</DialogTitle>
            <DialogDescription>
              {{ location ? (location.province === location.city ? location.city : `${location.province} · ${location.city}`) : '' }}
            </DialogDescription>
          </DialogHeader>
          <div class="overflow-y-auto flex-1">
            <WeatherDetail :location="location" :weather-data="weatherAll" :show-header="false" />
          </div>
          <DialogFooter class="shrink-0 px-4 py-3 mx-0 mb-0">
            <Button variant="outline" size="sm" @click="weatherDialogOpen = false">关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Button variant="ghost" size="icon" class="rounded-full bg-white/20 hover:bg-white/30 text-white border-0">
        <Icon icon="carbon:favorite-filled" class="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        class="rounded-full border-0"
        :class="props.quickLinksEditMode ? 'bg-white/40 hover:bg-white/50 text-white' : 'bg-white/20 hover:bg-white/30 text-white'"
        @click="emit('toggleQuickLinksEdit')"
      >
        <Icon :icon="props.quickLinksEditMode ? 'carbon:checkmark' : 'carbon:edit'" class="size-4" />
      </Button>
      <Button variant="ghost" size="icon" class="rounded-full bg-white/20 hover:bg-white/30 text-white border-0" @click="emit('openSettings')">
        <Icon icon="carbon:settings" class="size-4" />
      </Button>
    </div>
  </header>
</template>

<style scoped>
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
.type-cursor {
  animation: blink 1s step-end infinite;
}
</style>

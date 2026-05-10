<script setup lang="ts">
import { ref, watch } from 'vue';
import type { AppConfig, ConfigEngine } from '@/nav-data';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Icon } from '@iconify/vue';

const props = defineProps<{
  config: AppConfig;
  open: boolean;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  save: [config: AppConfig];
}>();

const editingConfig = ref<AppConfig>(JSON.parse(JSON.stringify(props.config)));
const editingEngines = ref<ConfigEngine[]>([]);

function cloneConfig(config: AppConfig): AppConfig {
  const cloned = JSON.parse(JSON.stringify(config)) as AppConfig;
  cloned.show_poem = cloned.show_poem !== false;
  cloned.show_line_animation = cloned.show_line_animation !== false;
  cloned.remember_engine = !!cloned.remember_engine;
  cloned.new_tab = cloned.new_tab !== false;
  return cloned;
}

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    editingConfig.value = cloneConfig(props.config);
    const engines = JSON.parse(JSON.stringify(props.config.engine));
    engines.sort((a: ConfigEngine, b: ConfigEngine) => b.order - a.order);
    editingEngines.value = engines;
  }
});

function addEngine() {
  editingEngines.value.push({ name: '', des: '', url: '', order: editingEngines.value.length + 1 });
}

function removeEngine(index: number) {
  editingEngines.value.splice(index, 1);
}

function sortEnginesByOrder() {
  editingEngines.value.sort((a, b) => b.order - a.order);
}

function save() {
  const validEngines = editingEngines.value.filter((e) => e.name && e.url);
  if (validEngines.length === 0) {
    alert('至少保留一个搜索引擎');
    return;
  }
  // 限制排序不超过999
  validEngines.forEach((e) => {
    e.order = Math.min(Math.max(e.order, 1), 999);
  });
  validEngines.sort((a, b) => b.order - a.order);
  editingConfig.value.engine = validEngines;
  emit('save', editingConfig.value);
  emit('update:open', false);
}

function confirmReset() {
  if (confirm('确定要恢复初始化吗？这将清除所有本地数据（包括设置、搜索历史、快捷链接等）且无法撤销。')) {
    localStorage.clear();
    window.location.reload();
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="w-full max-w-3xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
      <DialogHeader class="shrink-0 px-4 pt-4 pb-2">
        <DialogTitle>设置</DialogTitle>
        <DialogDescription>自定义搜索引擎、标题和页面样式</DialogDescription>
      </DialogHeader>

      <div class="overflow-y-auto flex-1 px-4">
        <div class="space-y-5 py-2">
        <!-- 标题 -->
        <div class="space-y-2">
          <Label for="set-title">页面标题</Label>
          <Input id="set-title" v-model="editingConfig.title" placeholder="New Tab" />
        </div>

        <!-- 新标签页 -->
        <div class="flex items-center justify-between">
          <Label for="set-newtab">搜索结果在新标签页打开</Label>
          <Switch id="set-newtab" v-model="editingConfig.new_tab" />
        </div>

        <!-- 记忆搜索引擎 -->
        <div class="flex items-center justify-between">
          <Label for="set-remember">记忆选择的搜索引擎</Label>
          <Switch id="set-remember" v-model="editingConfig.remember_engine" />
        </div>

        <!-- 背景动画 -->
        <div class="flex items-center justify-between">
          <Label for="set-lines">背景动画</Label>
          <Switch id="set-lines" v-model="editingConfig.show_line_animation" />
        </div>

        <!-- 左上角诗句 -->
        <div class="flex items-center justify-between">
          <Label for="set-poem">左上角诗句</Label>
          <Switch id="set-poem" v-model="editingConfig.show_poem" />
        </div>

        <!-- 搜索引擎 -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <Label>搜索引擎</Label>
            <Button variant="outline" size="sm" @click="addEngine">添加</Button>
          </div>
          <div class="space-y-3">
            <div
              v-for="(engine, index) in editingEngines"
              :key="index"
              class="rounded-lg border bg-card p-3 space-y-2"
            >
              <div class="grid grid-cols-[80px_1fr_1fr_auto] gap-2 items-center">
                <Input v-model.number="engine.order" type="number" placeholder="排序" class="h-8 text-sm" @change="sortEnginesByOrder" @keydown.enter="sortEnginesByOrder" />
                <Input v-model="engine.name" placeholder="名称" class="h-8 text-sm" />
                <Input v-model="engine.des" placeholder="描述" class="h-8 text-sm" />
                <Button variant="ghost" size="icon" class="h-8 w-8 text-red-500" @click="removeEngine(index)">
                  <Icon icon="carbon:close" class="size-3.5" />
                </Button>
              </div>
              <Input v-model="engine.url" placeholder="搜索 URL（用 %s 代替关键词）" class="h-8 text-sm w-full" />
            </div>
          </div>
        </div>

        <!-- 背景图 -->
        <div class="space-y-2">
          <Label for="set-bg">背景图片 URL（留空使用默认渐变）</Label>
          <Input id="set-bg" v-model="editingConfig.bg" placeholder="https://..." />
        </div>

        <!-- 自定义背景 CSS -->
        <div class="space-y-2">
          <Label for="set-css">自定义 CSS</Label>
          <Textarea
            id="set-css"
            v-model="editingConfig.customCss"
            placeholder="body { background: linear-gradient(...) }"
            rows="4"
          />
          <p class="text-xs text-muted-foreground">默认背景 CSS：<code class="bg-muted px-1 rounded">body { background: linear-gradient(to bottom, #0ea5e9, #06b6d4); }</code></p>
        </div>
      </div>

      </div>

      <DialogFooter class="shrink-0 px-4 py-4 mx-0 mb-0">
        <Button variant="destructive" size="sm" @click="confirmReset">恢复初始化</Button>
        <div class="flex-1" />
        <Button variant="outline" @click="emit('update:open', false)">取消</Button>
        <Button @click="save">保存</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

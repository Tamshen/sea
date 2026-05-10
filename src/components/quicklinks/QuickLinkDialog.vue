<script setup lang="ts">
import { ref, watch } from 'vue';
import type { QuickLink, QuickLinkCategory } from '@/nav-data';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Icon } from '@iconify/vue';
import IconPickerDialog from './IconPickerDialog.vue';

const props = defineProps<{
  open: boolean;
  link?: QuickLink | null;
  categories: QuickLinkCategory[];
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  save: [link: QuickLink];
}>();

const title = ref('');
const url = ref('');
const desc = ref('');
const icon = ref('');
const newTab = ref(true);
const categoryId = ref('');
const isEdit = ref(false);
const iconPickerOpen = ref(false);

function resetForm() {
  title.value = '';
  url.value = '';
  desc.value = '';
  icon.value = '';
  newTab.value = true;
  categoryId.value = props.categories[0]?.id ?? '';
  isEdit.value = false;
}

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    if (props.link) {
      title.value = props.link.title;
      url.value = props.link.url;
      desc.value = props.link.desc || '';
      icon.value = props.link.icon || '';
      newTab.value = props.link.newTab !== false;
      categoryId.value = props.link.categoryId || props.categories[0]?.id || '';
      isEdit.value = true;
    } else {
      resetForm();
    }
  }
});

function save() {
  const t = title.value.trim();
  let u = url.value.trim();
  if (!t || !u) return;
  if (!/^https?:\/\//i.test(u) && !u.startsWith('//')) {
    u = 'https://' + u;
  }
  const link: QuickLink = {
    id: props.link?.id ?? Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    title: t,
    url: u,
    desc: desc.value.trim() || undefined,
    icon: icon.value.trim() || undefined,
    newTab: newTab.value,
    categoryId: categoryId.value || undefined,
  };
  emit('save', link);
  emit('update:open', false);
}

function isIconifyIcon(val: string): boolean {
  return !!val && val.includes(':') && !val.startsWith('http');
}

const iconPreview = ref('');
watch(icon, (val) => {
  iconPreview.value = val;
});
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="w-full max-w-md p-0 overflow-hidden flex flex-col">
      <DialogHeader class="shrink-0 px-4 pt-4 pb-2">
        <DialogTitle>{{ isEdit ? '编辑快捷链接' : '添加快捷链接' }}</DialogTitle>
        <DialogDescription>自定义标题、网址、图标和打开方式</DialogDescription>
      </DialogHeader>

      <div class="space-y-4 px-4 py-2 overflow-y-auto">
        <div class="space-y-2">
          <Label for="ql-title">标题 <span class="text-red-500">*</span></Label>
          <Input id="ql-title" v-model="title" placeholder="例如：GitHub" />
        </div>

        <div class="space-y-2">
          <Label for="ql-url">网址 <span class="text-red-500">*</span></Label>
          <Input id="ql-url" v-model="url" placeholder="https://github.com" />
        </div>

        <div class="space-y-2">
          <Label for="ql-desc">介绍</Label>
          <Input id="ql-desc" v-model="desc" placeholder="简短描述（可选）" />
        </div>

        <div class="space-y-2">
          <Label>分类</Label>
          <Select v-model="categoryId">
            <SelectTrigger class="w-full">
              <SelectValue placeholder="选择分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="cat in categories"
                :key="cat.id"
                :value="cat.id"
              >
                {{ cat.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <Label>图标</Label>
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="flex-1 flex items-center gap-2 rounded-md border border-input bg-white px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors"
              @click="iconPickerOpen = true"
            >
              <span v-if="iconPreview" class="flex items-center gap-2">
                <Icon v-if="isIconifyIcon(iconPreview)" :icon="iconPreview" class="size-5 text-gray-700" />
                <img v-else :src="iconPreview" class="size-5 object-contain" alt="icon" />
                <span class="text-gray-700">{{ iconPreview }}</span>
              </span>
              <span v-else class="text-gray-400">点击选择图标或输入图标名称</span>
            </button>
            <button
              type="button"
              class="h-10 px-3 rounded-md border border-input bg-white text-sm text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
              @click="iconPickerOpen = true"
            >
              选择
            </button>
          </div>
          <Input
            v-model="icon"
            placeholder="或手动输入：图标组件如 carbon:home 或图片 URL"
            class="text-sm"
          />
        </div>

        <div class="flex items-center justify-between">
          <Label for="ql-newtab">在新标签页打开</Label>
          <Switch id="ql-newtab" v-model="newTab" />
        </div>
      </div>

      <DialogFooter class="shrink-0 px-4 py-4 mx-0 mb-0">
        <Button variant="outline" @click="emit('update:open', false)">取消</Button>
        <Button :disabled="!title.trim() || !url.trim()" @click="save">保存</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <IconPickerDialog
    :open="iconPickerOpen"
    :current-icon="icon"
    @update:open="iconPickerOpen = $event"
    @select="icon = $event"
  />
</template>

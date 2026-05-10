<script setup lang="ts">
import { ref, computed } from 'vue';
import { iconCategories, searchIcons } from './iconData';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
  open: boolean;
  currentIcon?: string;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  select: [icon: string];
}>();

const searchQuery = ref('');
const selectedIcon = ref('');

const allIcons = computed(() => iconCategories[0]?.icons ?? []);

const filteredIcons = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return allIcons.value;
  return allIcons.value.filter((icon) => icon.toLowerCase().includes(q));
});

function selectIcon(icon: string) {
  selectedIcon.value = icon;
  emit('select', icon);
  emit('update:open', false);
}

function onOpenChange(isOpen: boolean) {
  if (isOpen) {
    searchQuery.value = '';
    selectedIcon.value = props.currentIcon || '';
  }
  emit('update:open', isOpen);
}

function clearSearch() {
  searchQuery.value = '';
}
</script>

<template>
  <Dialog :open="open" @update:open="onOpenChange">
    <DialogContent class="w-full max-w-md p-0 overflow-hidden flex flex-col">
      <DialogHeader class="shrink-0 px-4 pt-4 pb-2">
        <DialogTitle>选择图标</DialogTitle>
        <DialogDescription>点击图标即可选中</DialogDescription>
      </DialogHeader>

      <!-- Search -->
      <div class="px-4 pb-3 shrink-0">
        <div class="relative">
          <Input
            v-model="searchQuery"
            placeholder="搜索图标..."
            class="pr-8"
          />
          <button
            v-if="searchQuery"
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            @click="clearSearch"
          >
            <Icon icon="carbon:close" class="size-4" />
          </button>
          <Icon v-else icon="carbon:search" class="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
        </div>
      </div>

      <!-- Icons Grid with native scrollbar -->
      <div class="flex-1 px-4 pb-4 min-h-0 overflow-y-auto" style="max-height: 320px;">
        <div v-if="filteredIcons.length === 0" class="text-center text-sm text-gray-400 py-8">
          未找到匹配的图标
        </div>
        <div v-else class="grid grid-cols-6 gap-2">
          <button
            v-for="iconName in filteredIcons"
            :key="iconName"
            type="button"
            class="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            :class="selectedIcon === iconName ? 'bg-blue-50 ring-1 ring-blue-500' : ''"
            :title="iconName"
            @click="selectIcon(iconName)"
          >
            <Icon :icon="iconName" class="size-5 text-gray-700" />
            <span class="text-[10px] text-gray-500 truncate w-full text-center">{{ iconName.split(':')[1] }}</span>
          </button>
        </div>
      </div>

      <DialogFooter class="shrink-0 px-4 py-4 mx-0 mb-0">
        <Button variant="outline" @click="emit('update:open', false)">取消</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

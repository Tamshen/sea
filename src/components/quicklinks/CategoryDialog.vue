<script setup lang="ts">
import { ref, watch } from 'vue';
import type { QuickLinkCategory } from '@/nav-data';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
  categories: QuickLinkCategory[];
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  save: [categories: QuickLinkCategory[]];
}>();

const editingCategories = ref<QuickLinkCategory[]>([]);

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    editingCategories.value = JSON.parse(JSON.stringify(props.categories));
  }
});

function addCategory() {
  editingCategories.value.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: '',
    order: 1,
  });
}

function removeCategory(index: number) {
  editingCategories.value.splice(index, 1);
}

function sortCategories() {
  editingCategories.value.sort((a, b) => b.order - a.order);
}

function save() {
  const valid = editingCategories.value.filter((c) => c.name.trim());
  if (valid.length === 0) {
    alert('至少保留一个分类');
    return;
  }
  valid.forEach((c) => {
    c.order = Math.min(Math.max(c.order, 1), 999);
  });
  valid.sort((a, b) => b.order - a.order);
  emit('save', valid);
  emit('update:open', false);
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="w-full max-w-lg p-0 overflow-hidden flex flex-col max-h-[80vh]">
      <DialogHeader class="shrink-0 px-4 pt-4 pb-2">
        <DialogTitle>管理分类</DialogTitle>
        <DialogDescription>数字越大排序越靠前</DialogDescription>
      </DialogHeader>

      <div class="overflow-y-auto flex-1 px-4 py-2">
        <div class="space-y-2">
          <div
            v-for="(cat, index) in editingCategories"
            :key="cat.id"
            class="rounded-lg border bg-card p-3 space-y-2"
          >
            <div class="grid grid-cols-[80px_1fr_auto] gap-2 items-center">
              <Input
                v-model.number="cat.order"
                type="number"
                placeholder="排序"
                class="h-8 text-sm"
                @change="sortCategories"
                @keydown.enter="sortCategories"
              />
              <Input v-model="cat.name" placeholder="分类名称" class="h-8 text-sm" />
              <Button
                variant="ghost"
                size="icon"
                class="h-8 w-8 text-red-500"
                @click="removeCategory(index)"
              >
                <Icon icon="carbon:trash-can" class="size-3.5" />
              </Button>
            </div>
          </div>
        </div>

        <Button variant="outline" size="sm" class="mt-3 w-full" @click="addCategory">
          <Icon icon="carbon:add" class="size-3.5 mr-1" />
          添加分类
        </Button>
      </div>

      <DialogFooter class="shrink-0 px-4 py-4 mx-0 mb-0">
        <Button variant="outline" @click="emit('update:open', false)">取消</Button>
        <Button @click="save">保存</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

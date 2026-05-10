<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import type { QuickLink, QuickLinkCategory } from '@/nav-data';
import {
  loadQuickLinks,
  saveQuickLinks,
  removeQuickLink,
  loadCategories,
  saveCategories,
} from '@/nav-data';
import QuickLinkDialog from './QuickLinkDialog.vue';
import CategoryDialog from './CategoryDialog.vue';
import { Icon } from '@iconify/vue';

const props = defineProps<{
  globalNewTab: boolean;
  editMode?: boolean;
}>();

const emit = defineEmits<{
  'update:editMode': [value: boolean];
}>();

const links = ref<QuickLink[]>(loadQuickLinks());
const categories = ref<QuickLinkCategory[]>(loadCategories());
const dialogOpen = ref(false);
const categoryDialogOpen = ref(false);
const editingLink = ref<QuickLink | null>(null);

// Context menu state
const contextMenuVisible = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
const contextMenuTarget = ref<QuickLink | null>(null);

const sortedCategories = computed(() => {
  return [...categories.value].sort((a, b) => b.order - a.order);
});

function getCategoryLinks(catId: string) {
  return links.value.filter((l) => (l.categoryId || 'default') === catId);
}

function getCategoryName(catId: string) {
  return categories.value.find((c) => c.id === catId)?.name || '默认';
}

function isIconifyIcon(val?: string): boolean {
  return !!val && val.includes(':') && !val.startsWith('http');
}

function openLink(link: QuickLink) {
  if (props.editMode) return;
  const shouldNewTab = link.newTab !== undefined ? link.newTab : props.globalNewTab;
  if (shouldNewTab) {
    window.open(link.url, '_blank');
  } else {
    window.location.href = link.url;
  }
}

function onSave(link: QuickLink) {
  const list = loadQuickLinks();
  const index = list.findIndex((l) => l.id === link.id);
  if (index >= 0) {
    list[index] = link;
  } else {
    list.push(link);
  }
  saveQuickLinks(list);
  links.value = [...list];
}

function onDelete(id: string) {
  removeQuickLink(id);
  links.value = loadQuickLinks();
}

function onEdit(link: QuickLink) {
  editingLink.value = link;
  dialogOpen.value = true;
}

function onAdd() {
  editingLink.value = null;
  dialogOpen.value = true;
}

function onDialogClose() {
  dialogOpen.value = false;
  editingLink.value = null;
}

function onSaveCategories(newCategories: QuickLinkCategory[]) {
  saveCategories(newCategories);
  categories.value = loadCategories();
}

// Context menu
function showContextMenu(e: MouseEvent, link?: QuickLink) {
  e.preventDefault();
  contextMenuTarget.value = link || null;

  const menuWidth = 160;
  const menuHeight = link ? 130 : 45;
  let x = e.clientX;
  let y = e.clientY;
  if (x + menuWidth > window.innerWidth) {
    x = window.innerWidth - menuWidth - 8;
  }
  if (y + menuHeight > window.innerHeight) {
    y = window.innerHeight - menuHeight - 8;
  }

  contextMenuX.value = x;
  contextMenuY.value = y;
  contextMenuVisible.value = true;
}

function hideContextMenu() {
  contextMenuVisible.value = false;
}

function handleMenuAction(action: 'add' | 'edit' | 'delete') {
  hideContextMenu();
  if (action === 'add') {
    onAdd();
  } else if (action === 'edit' && contextMenuTarget.value) {
    onEdit(contextMenuTarget.value);
  } else if (action === 'delete' && contextMenuTarget.value) {
    onDelete(contextMenuTarget.value.id);
  }
}

function onDocumentClick() {
  hideContextMenu();
}

function onDocumentKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    hideContextMenu();
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick);
  document.addEventListener('keydown', onDocumentKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick);
  document.removeEventListener('keydown', onDocumentKeydown);
});
</script>

<template>
  <div v-if="editMode || links.length > 0" class="w-full max-w-3xl mt-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-white/90">快捷链接</span>
        <span class="text-xs text-white/50">{{ links.length }}</span>
      </div>
      <div v-if="editMode" class="flex items-center gap-2">
        <button
          type="button"
          class="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
          @click="categoryDialogOpen = true"
        >
          <Icon icon="carbon:folder" class="size-3.5" />
          <span>分类</span>
        </button>
        <button
          type="button"
          class="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
          @click="onAdd"
        >
          <Icon icon="carbon:add" class="size-3.5" />
          <span>添加</span>
        </button>
      </div>
    </div>

    <!-- Categories -->
    <div class="space-y-4">
      <div v-for="cat in sortedCategories" :key="cat.id">
        <div v-if="getCategoryLinks(cat.id).length > 0 || editMode">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xs font-medium text-white/70">{{ cat.name }}</span>
            <span class="text-[10px] text-white/40">{{ getCategoryLinks(cat.id).length }}</span>
          </div>

          <div class="flex flex-wrap gap-3 items-start" @contextmenu="showContextMenu($event)">
            <div
              v-for="link in getCategoryLinks(cat.id)"
              :key="link.id"
              class="relative flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 shadow-sm transition-all select-none"
              :class="editMode
                ? 'bg-white/95 cursor-default ring-1 ring-blue-400/50'
                : 'bg-white/90 hover:bg-white cursor-pointer hover:shadow'"
              @click="openLink(link)"
              @contextmenu.stop="showContextMenu($event, link)"
            >
              <div class="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                <Icon v-if="isIconifyIcon(link.icon)" :icon="link.icon" class="size-4.5 text-gray-700" />
                <img v-else-if="link.icon" :src="link.icon" class="size-4.5 object-contain" alt="icon" />
                <Icon v-else icon="carbon:link" class="size-4.5 text-gray-400" />
              </div>
              <div class="flex flex-col min-w-0">
                <span class="text-sm font-medium text-gray-800 truncate">{{ link.title }}</span>
                <span v-if="link.desc" class="text-xs text-gray-500 truncate">{{ link.desc }}</span>
              </div>

              <!-- edit mode actions -->
              <div v-if="editMode" class="flex items-center gap-0.5 ml-1">
                <button
                  type="button"
                  class="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                  @click.stop="onEdit(link)"
                >
                  <Icon icon="carbon:edit" class="size-3.5" />
                </button>
                <button
                  type="button"
                  class="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                  @click.stop="onDelete(link.id)"
                >
                  <Icon icon="carbon:trash-can" class="size-3.5" />
                </button>
              </div>
            </div>

            <!-- Add button in edit mode -->
            <button
              v-if="editMode"
              type="button"
              class="flex items-center gap-2 rounded-xl px-3.5 py-2.5 border border-dashed border-gray-300 bg-white/90 text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-all cursor-pointer select-none"
              @click="onAdd"
            >
              <Icon icon="carbon:add" class="size-5" />
              <span class="text-sm">添加</span>
            </button>
          </div>
        </div>
      </div>

    </div>

    <!-- Custom Context Menu -->
    <div
      v-if="contextMenuVisible"
      class="fixed z-[100] bg-white rounded-lg shadow-xl border py-1 min-w-[140px] select-none"
      :style="{ left: contextMenuX + 'px', top: contextMenuY + 'px' }"
      @click.stop
    >
      <button
        type="button"
        class="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        @click="handleMenuAction('add')"
      >
        <Icon icon="carbon:add" class="size-4 text-gray-500" />
        <span>新建</span>
      </button>
      <div v-if="contextMenuTarget" class="h-px bg-gray-100 my-0.5"></div>
      <button
        v-if="contextMenuTarget"
        type="button"
        class="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        @click="handleMenuAction('edit')"
      >
        <Icon icon="carbon:edit" class="size-4 text-gray-500" />
        <span>编辑</span>
      </button>
      <button
        v-if="contextMenuTarget"
        type="button"
        class="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
        @click="handleMenuAction('delete')"
      >
        <Icon icon="carbon:trash-can" class="size-4 text-red-400" />
        <span>删除</span>
      </button>
    </div>

    <QuickLinkDialog
      :open="dialogOpen"
      :link="editingLink"
      :categories="categories"
      @update:open="onDialogClose"
      @save="onSave"
    />

    <CategoryDialog
      :open="categoryDialogOpen"
      :categories="categories"
      @update:open="categoryDialogOpen = $event"
      @save="onSaveCategories"
    />
  </div>
</template>

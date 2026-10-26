import { ref } from 'vue';

const FAVORITES_STORAGE_KEY = 'devcrate_favorites';

function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : ['json-formatter', 'timestamp'];
  } catch {
    return ['json-formatter', 'timestamp'];
  }
}

export const favorites = ref<string[]>(loadFavorites());

export function toggleFavorite(id: string) {
  const index = favorites.value.indexOf(id);
  if (index > -1) {
    favorites.value.splice(index, 1);
  } else {
    favorites.value.push(id);
  }
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites.value));
}

export function isFavorite(id: string): boolean {
  return favorites.value.includes(id);
}

// 导航状态
export type ViewType = 'all' | 'favorites' | 'category' | 'tool' | 'settings';

export const currentView = ref<ViewType>('all');
export const activeCategoryId = ref<string>('all');
export const activeToolId = ref<string>('');
export const searchQuery = ref<string>('');
export const isSidebarCollapsed = ref<boolean>(false);

export function selectTool(toolId: string) {
  activeToolId.value = toolId;
  currentView.value = 'tool';
}

export function selectCategory(catId: string) {
  if (catId === 'all') {
    currentView.value = 'all';
    activeCategoryId.value = 'all';
  } else if (catId === 'favorites') {
    currentView.value = 'favorites';
    activeCategoryId.value = 'favorites';
  } else {
    currentView.value = 'category';
    activeCategoryId.value = catId;
  }
  activeToolId.value = '';
}

export function openSettings() {
  currentView.value = 'settings';
  activeToolId.value = '';
}

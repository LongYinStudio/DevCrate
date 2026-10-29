import type { Component } from 'vue';

export type CategoryId =
  | 'all'
  | 'favorites'
  | 'converters'
  | 'encoders'
  | 'formatters'
  | 'generators'
  | 'text'
  | 'network';

export interface CategoryInfo {
  id: CategoryId;
  nameKey: string;
  icon: Component;
}

export interface ToolItem {
  id: string;
  categoryId: CategoryId;
  nameKey: string;
  descKey: string;
  icon: Component;
  keywords: string[];
  component: Component;
}

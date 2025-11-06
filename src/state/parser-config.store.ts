/**
 * Zustand store для управления состоянием конфигураций парсера
 * Client state только для UI
 * @module parser-config.store
 * @version 1.0.0
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { ParserConfig } from '@lib/types/parser.types';

/**
 * Состояние конфигураций парсера
 */
interface ParserConfigState {
  configs: ParserConfig[];
  activeConfigId: string | null;
  isEditing: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Действия над состоянием
 */
interface ParserConfigActions {
  // CRUD операции
  addConfig: (config: ParserConfig) => void;
  updateConfig: (id: string, updates: Partial<ParserConfig>) => void;
  deleteConfig: (id: string) => void;
  setConfigs: (configs: ParserConfig[]) => void;
  
  // Управление активной конфигурацией
  setActiveConfig: (id: string | null) => void;
  
  // UI состояние
  setEditing: (isEditing: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Утилиты
  clearError: () => void;
  reset: () => void;
}

/**
 * Полный тип store
 */
type ParserConfigStore = ParserConfigState & ParserConfigActions;

/**
 * Начальное состояние
 */
const initialState: ParserConfigState = {
  configs: [],
  activeConfigId: null,
  isEditing: false,
  isLoading: false,
  error: null
};

/**
 * Zustand store для конфигураций парсера
 */
export const useParserConfigStore = create<ParserConfigStore>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        // CRUD операции
        addConfig: (config) =>
          set((state) => ({
            configs: [...state.configs, config]
          })),

        updateConfig: (id, updates) =>
          set((state) => ({
            configs: state.configs.map((c) =>
              c.id === id ? { ...c, ...updates } as ParserConfig : c
            )
          })),

        deleteConfig: (id) =>
          set((state) => ({
            configs: state.configs.filter((c) => c.id !== id),
            activeConfigId: state.activeConfigId === id ? null : state.activeConfigId
          })),

        setConfigs: (configs) =>
          set({ configs }),

        // Управление активной конфигурацией
        setActiveConfig: (id) =>
          set({ activeConfigId: id }),

        // UI состояние
        setEditing: (isEditing) =>
          set({ isEditing }),

        setLoading: (isLoading) =>
          set({ isLoading }),

        setError: (error) =>
          set({ error }),

        // Утилиты
        clearError: () =>
          set({ error: null }),

        reset: () => set(initialState)
      }),
      {
        name: 'parser-config-storage',
        partialize: (state) => ({
          configs: state.configs,
          activeConfigId: state.activeConfigId
        })
      }
    ),
    { name: 'ParserConfigStore' }
  )
);

/**
 * Селекторы для удобного доступа к состоянию
 */
export const selectActiveConfig = (state: ParserConfigStore): ParserConfig | undefined =>
  state.configs.find((c) => c.id === state.activeConfigId);

export const selectConfigById = (id: string) => (state: ParserConfigStore): ParserConfig | undefined =>
  state.configs.find((c) => c.id === id);

export const selectConfigsByUrl = (url: string) => (state: ParserConfigStore): ParserConfig[] =>
  state.configs.filter((config) => {
    if (typeof config.targetUrl === 'string') {
      return url.includes(config.targetUrl);
    }
    return config.targetUrl.test(url);
  });

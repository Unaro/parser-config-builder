/**
 * Zustand store для управления конфигурациями
 * @module parser-config.store
 * @version 1.0.0
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { ParserConfig } from '@lib/types/parser.types';

interface ParserConfigState {
  configs: ParserConfig[];
  activeConfigId: string | null;
  isEditing: boolean;
  isLoading: boolean;
  error: string | null;
}

interface ParserConfigActions {
  addConfig: (config: ParserConfig) => void;
  updateConfig: (id: string, updates: Partial<ParserConfig>) => void;
  deleteConfig: (id: string) => void;
  setConfigs: (configs: ParserConfig[]) => void;
  setActiveConfig: (id: string | null) => void;
  setEditing: (isEditing: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

type ParserConfigStore = ParserConfigState & ParserConfigActions;

const initialState: ParserConfigState = {
  configs: [],
  activeConfigId: null,
  isEditing: false,
  isLoading: false,
  error: null
};

export const useParserConfigStore = create<ParserConfigStore>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

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

        setActiveConfig: (id) =>
          set({ activeConfigId: id }),

        setEditing: (isEditing) =>
          set({ isEditing }),

        setLoading: (isLoading) =>
          set({ isLoading }),

        setError: (error) =>
          set({ error }),

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

export const selectActiveConfig = (state: ParserConfigStore): ParserConfig | undefined =>
  state.configs.find((c) => c.id === state.activeConfigId);

export const selectConfigById = (id: string) => (state: ParserConfigStore): ParserConfig | undefined =>
  state.configs.find((c) => c.id === id);

export const selectConfigsByUrl = (url: string) => (state: ParserConfigStore): ParserConfig[] =>
  state.configs.filter(config => url.startsWith(config.targetUrl));

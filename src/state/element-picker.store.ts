/**
 * Zustand store для визуального выбора элементов (element picker)
 * @module element-picker.store
 * @version 1.0.0
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { SelectorValidationResult } from '@lib/types/parser.types';

/**
 * Тип селектора, который выбирается
 */
type SelectorType = 'title' | 'chapters' | 'images' | 'author' | 'description' | 'cover' | 'tags';

/**
 * Состояние element picker
 */
interface ElementPickerState {
  isActive: boolean;
  currentSelectorType: SelectorType | null;
  hoveredElement: HTMLElement | null;
  selectedSelector: string | null;
  validationResults: Record<string, SelectorValidationResult>;
}

/**
 * Действия element picker
 */
interface ElementPickerActions {
  activate: (selectorType: SelectorType) => void;
  deactivate: () => void;
  setHoveredElement: (element: HTMLElement | null) => void;
  selectElement: (selector: string) => void;
  setValidationResult: (selector: string, result: SelectorValidationResult) => void;
  clearValidationResults: () => void;
  reset: () => void;
}

/**
 * Полный тип store
 */
type ElementPickerStore = ElementPickerState & ElementPickerActions;

/**
 * Начальное состояние
 */
const initialState: ElementPickerState = {
  isActive: false,
  currentSelectorType: null,
  hoveredElement: null,
  selectedSelector: null,
  validationResults: {}
};

/**
 * Zustand store для element picker
 */
export const useElementPickerStore = create<ElementPickerStore>()(
  devtools(
    (set) => ({
      ...initialState,

      activate: (selectorType) =>
        set({
          isActive: true,
          currentSelectorType: selectorType
        }),

      deactivate: () =>
        set({
          isActive: false,
          currentSelectorType: null,
          hoveredElement: null
        }),

      setHoveredElement: (element) =>
        set({ hoveredElement: element }),

      selectElement: (selector) =>
        set({
          selectedSelector: selector,
          isActive: false,
          hoveredElement: null
        }),

      setValidationResult: (selector, result) =>
        set((state) => ({
          validationResults: {
            ...state.validationResults,
            [selector]: result
          }
        })),

      clearValidationResults: () =>
        set({ validationResults: {} }),

      reset: () => set(initialState)
    }),
    { name: 'ElementPickerStore' }
  )
);

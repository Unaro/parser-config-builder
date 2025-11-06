/**
 * SelectorInput - компонент для ввода и визуального выбора CSS селектора
 * @module components/features/SelectorInput
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';
import { Input } from '@components/ui/Input';
import { Button } from '@components/ui/Button';
import { eventBus } from '@lib/events/event-bus';
import { ParserEventFactory } from '@lib/events/parser.events';
import type { ElementPickedEvent } from '@lib/events/parser.events';
import type { SelectorValidationResult } from '@lib/types/parser.types';

export interface SelectorInputProps {
  label: string;
  value: string;
  selectorType: 'title' | 'chapters' | 'images' | 'author' | 'description' | 'cover' | 'tags';
  onChange: (value: string) => void;
  onValidate?: (result: SelectorValidationResult) => void;
  required?: boolean;
}

/**
 * SelectorInput компонент
 */
export function SelectorInput({
  label,
  value,
  selectorType,
  onChange,
  onValidate,
  required = false
}: SelectorInputProps) {
  const [isPicking, setIsPicking] = useState(false);
  const [validation, setValidation] = useState<SelectorValidationResult | null>(null);

  useEffect(() => {
    // Подписка на событие выбранного элемента
    const unsubscribe = eventBus.subscribe<ElementPickedEvent['data']>(
      'element.picked',
      (event) => {
        if (event.data.selectorType === selectorType) {
          onChange(event.data.selector);
          setIsPicking(false);
          
          // Автоматическая валидация после выбора
          const validationResult: SelectorValidationResult = {
            selector: event.data.selector,
            status: 'valid',
            elementCount: 1,
            previewText: event.data.previewText
          };
          
          setValidation(validationResult);
          onValidate?.(validationResult);
        }
      }
    );

    return () => unsubscribe();
  }, [selectorType, onChange, onValidate]);

  /**
   * Начать визуальный выбор элемента
   */
  const handlePickElement = async () => {
    setIsPicking(true);
    
    const event = ParserEventFactory.createElementPickRequest(selectorType);
    await eventBus.publish(event);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="CSS selector (e.g., .manga-title)"
          required={required}
          fullWidth
        />
        
        <Button
          variant="secondary"
          onClick={handlePickElement}
          disabled={isPicking}
          className="mt-6"
          title="Pick element on page"
        >
          {isPicking ? 'Pick element...' : 'Pick'}
        </Button>
      </div>

      {validation && (
        <div className={`text-sm ${validation.status === 'valid' ? 'text-green-600' : 'text-red-600'}`}>
          {validation.status === 'valid' ? (
            <>
              Found elements: {validation.elementCount}
              {validation.previewText && (
                <div className="text-gray-600 text-xs mt-1 truncate">
                  Preview: "{validation.previewText}"
                </div>
              )}
            </>
          ) : (
            <>
              {validation.error || 'No elements found'}
            </>
          )}
        </div>
      )}
    </div>
  );
}

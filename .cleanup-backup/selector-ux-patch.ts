/**
 * UX: Enhance Selector Editor with in-place selection button and human-friendly extraction types
 */

import { ConfigSidebar } from './config-sidebar';

// patch: augment renderSelectorEditor to include "Pick element" button and friendly labels
// Note: This patch assumes the existing ConfigSidebar is restored. We extend behaviors via DOM bindings.

(function patchSelectorEditorUX(){
  const proto = ConfigSidebar.prototype as any;
  if (!proto.__patchedSelectorUX) {
    const originalBindSelectorEditorEvents = proto.bindSelectorEditorEvents;
    proto.bindSelectorEditorEvents = function patchedBindSelectorEditorEvents() {
      originalBindSelectorEditorEvents.call(this);
      const pickBtnId = 'pcb-pick-element';
      // Inject button next to preview if missing
      const form = this.sidebarElement?.querySelector('.pcb-selector-form');
      if (form && !this.sidebarElement?.querySelector('#'+pickBtnId)) {
        const primaryRow = this.sidebarElement.querySelector('#pcb-preview-selector')?.parentElement;
        if (primaryRow) {
          const pickBtn = document.createElement('button');
          pickBtn.id = pickBtnId;
          pickBtn.textContent = '🎯 Выбрать элемент';
          pickBtn.className = 'btn btn--secondary';
          pickBtn.style.marginLeft = '8px';
          primaryRow.appendChild(pickBtn);
          pickBtn.addEventListener('click', () => {
            // Start selection from inside editor
            if (!this.selectedField || !this.currentConfig) return;
            const field = this.currentConfig.schema.fields.find((f:any)=>f.name===this.selectedField);
            if (!field) return;
            this.onMessage({ type: 'START_SELECTION', fieldName: field.name, fieldType: field.type, id: `sidebar_${Date.now()}`, timestamp: Date.now() });
          });
        }
      }

      // Human-friendly extraction type labels with helper tooltip
      const typeSelect = this.sidebarElement?.querySelector('#pcb-extraction-type') as HTMLSelectElement | null;
      if (typeSelect) {
        const map: Record<string,string> = {
          text: 'Текст внутри',
          attribute: 'Ссылка/адрес (атрибут)',
          html: 'HTML код',
          array: 'Список элементов',
          count: 'Количество',
          exists: 'Есть/нет'
        };
        Array.from(typeSelect.options).forEach(opt => {
          const key = opt.value; if (map[key]) opt.text = map[key];
        });
        // Context tip area
        let tip = this.sidebarElement?.querySelector('#pcb-extract-tip') as HTMLElement | null;
        if (!tip) {
          tip = document.createElement('div');
          tip.id = 'pcb-extract-tip';
          tip.style.cssText = 'font-size:12px;color:#666;margin-top:6px;';
          typeSelect.parentElement?.appendChild(tip);
        }
        const renderTip = () => {
          const v = typeSelect.value;
          const tips: Record<string,string> = {
            text: 'Извлекается видимый текст, например: Название, Автор.',
            attribute: 'Извлекается атрибут (по умолчанию href/src). Настройка ниже.',
            html: 'Извлекается HTML содержимое элемента.',
            array: 'Возвращается массив значений по совпавшим элементам.',
            count: 'Возвращается число совпавших элементов.',
            exists: 'Возвращается true/false — найден ли хотя бы один элемент.'
          };
          tip!.textContent = tips[v] || '';
        };
        typeSelect.addEventListener('change', renderTip);
        renderTip();
      }
    };
    proto.__patchedSelectorUX = true;
  }
})();

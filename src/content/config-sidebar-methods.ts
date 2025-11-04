/**
 * Integrate UX changes directly: Add Field modal + in-editor Pick button + friendly extraction labels
 */
import type { ParserConfig } from '@/types';

export class SidebarUIMethods {
  // ... keep other methods
  static showAddFieldDialog(config: ParserConfig, onMessage: (message: any)=>void): void {
    const overlay = document.createElement('div');
    overlay.className = 'pcb-ui pcb-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:999999;display:flex;align-items:center;justify-content:center;';

    const modal = document.createElement('div');
    modal.className = 'pcb-ui pcb-modal';
    modal.style.cssText = 'width:560px;max-width:90vw;background:#fff;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.25);overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial;';

    modal.innerHTML = `
      <div style="padding:16px 20px;background:linear-gradient(135deg,#1890ff,#52c41a);color:#fff;font-weight:700;display:flex;align-items:center;justify-content:space-between;">
        <span>Добавить поле</span>
        <button id="pcb-close-add" class="pcb-ui" style="background:transparent;border:none;color:#fff;font-size:18px;cursor:pointer;">×</button>
      </div>
      <div style="padding:16px 20px;display:grid;gap:14px;">
        <div>
          <label style="font-weight:600;color:#333;">Название поля</label>
          <input id="pcb-new-field-name" type="text" placeholder="Например: Название, Автор, Жанры" style="width:100%;padding:10px 12px;border:2px solid #e8e8e8;border-radius:8px;font-size:14px;" />
        </div>
        <div>
          <label style="font-weight:600;color:#333;">Тип данных</label>
          <div id="pcb-type-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            ${[
              {k:'text',t:'Текст',d:'Название, Автор, Описание'},
              {k:'attribute',t:'Ссылка/адрес',d:'href, src, content'},
              {k:'html',t:'HTML код',d:'Разметка узла'},
              {k:'array',t:'Список',d:'Жанры, Теги, Авторы'},
              {k:'count',t:'Количество',d:'Число совпадений'},
              {k:'exists',t:'Есть/нет',d:'Проверка наличия'}
            ].map(item=>`
              <button class=\"pcb-ui pcb-type-card\" data-type=\"${item.k}\" style=\"text-align:left;padding:12px;border:2px solid #e8e8e8;border-radius:10px;cursor:pointer;background:#fff;\">\n                <div style=\"font-weight:700;color:#333;\">${item.t}</div>\n                <div style=\"font-size:12px;color:#666;\">${item.d}</div>\n              </button>
            `).join('')}
          </div>
          <div id="pcb-attr-wrap" style="display:none;margin-top:8px;">
            <label style="font-weight:600;color:#333;">Атрибут</label>
            <input id="pcb-new-field-attr" type="text" placeholder="href / src / content" style="width:100%;padding:10px 12px;border:2px solid #e8e8e8;border-radius:8px;font-size:14px;" />
          </div>
        </div>
        <div>
          <label style="font-weight:600;color:#333;">Описание (необязательно)</label>
          <input id="pcb-new-field-desc" type="text" placeholder="Подсказка для себя (например: берём имя автора из шапки)" style="width:100%;padding:10px 12px;border:2px solid #e8e8e8;border-radius:8px;font-size:14px;" />
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:4px;">
          <button id="pcb-cancel-add" class="pcb-ui" style="padding:10px 14px;border:2px solid #e8e8e8;border-radius:8px;background:#fff;cursor:pointer;">Отмена</button>
          <button id="pcb-save-add" class="pcb-ui" style="padding:10px 14px;border:none;border-radius:8px;background:#1890ff;color:#fff;cursor:pointer;font-weight:700;">Добавить</button>
        </div>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const nameInput = modal.querySelector('#pcb-new-field-name') as HTMLInputElement;
    const descInput = modal.querySelector('#pcb-new-field-desc') as HTMLInputElement;
    const attrInput = modal.querySelector('#pcb-new-field-attr') as HTMLInputElement;
    const attrWrap = modal.querySelector('#pcb-attr-wrap') as HTMLElement;

    let selectedType: string = 'text';

    const setActive = (btn: HTMLElement) => {
      modal.querySelectorAll('.pcb-type-card').forEach(b => (b as HTMLElement).style.borderColor = '#e8e8e8');
      btn.style.borderColor = '#1890ff';
    };

    const typeCards = Array.from(modal.querySelectorAll('.pcb-type-card')) as HTMLElement[];
    typeCards.forEach((btn, idx) => {
      if (idx === 0) setActive(btn);
      btn.addEventListener('click', () => {
        selectedType = btn.getAttribute('data-type') || 'text';
        setActive(btn);
        attrWrap.style.display = selectedType === 'attribute' ? '' : 'none';
      });
    });

    const close = () => overlay.remove();
    modal.querySelector('#pcb-close-add')?.addEventListener('click', close);
    modal.querySelector('#pcb-cancel-add')?.addEventListener('click', close);

    modal.querySelector('#pcb-save-add')?.addEventListener('click', () => {
      const name = nameInput.value.trim();
      if (!name) { alert('Введите название поля'); return; }
      const description = descInput.value.trim();
      const attribute = selectedType === 'attribute' ? (attrInput.value.trim() || 'href') : undefined;

      onMessage({
        type: 'CREATE_FIELD',
        field: { name, type: selectedType, description, required: false, ...(attribute ? { attribute } : {}) },
        id: `sidebar_${Date.now()}`,
        timestamp: Date.now()
      });
      close();
    });
  }
}

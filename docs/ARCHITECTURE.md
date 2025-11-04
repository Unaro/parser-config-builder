# Parser Config Builder — Comprehensive Architecture & Development Guide

Детальная архитектурная документация Chrome-расширения для визуального создания JSON-конфигураций парсеров манги/комиксов с элементами интерактивного выбора DOM-элементов.

## Обзор проекта

**Parser Config Builder** — это Chrome/Edge расширение (Manifest V3), которое позволяет пользователям визуально создавать конфигурации парсеров для манга-сайтов через:
- Интерактивный выбор DOM-элементов (hover + click)
- Полноценный Sidebar с редактором схемы и селекторов
- Модальные диалоги для создания полей с человекопонятными типами
- Автоматическую генерацию CSS-селекторов (DevTools-подобный алгоритм)
- Тестирование конфигураций на текущей странице
- Экспорт/импорт JSON-конфигураций

## Структура проекта

```
parser-config-builder/
├── src/
│   ├── background/           # Service Worker (MV3)
│   │   ├── background.ts     # Главный SW: команды, иконки, вкладки
│   │   └── patch-updateIcon.ts # Безопасное обновление иконки
│   ├── content/              # Content Scripts
│   │   ├── content-script.ts # Главный CS: обработка сообщений, координация
│   │   ├── config-sidebar.ts # UI Sidebar: схема, селекторы, история
│   │   ├── config-sidebar-methods.ts # UI методы: модалки, уведомления
│   │   ├── config-sidebar-helpers.ts # Хелперы: форматы, валидация
│   │   ├── element-selector.ts # Селектор элементов: hover, click, генерация
│   │   ├── content-styles.css # Стили для подсветки и UI
│   │   ├── add-field-modal.ts # [LEGACY] Модальное окно (интегрировано в methods)
│   │   └── selector-ux-patch.ts # [LEGACY] UX-патчи (интегрировано в sidebar)
│   ├── popup/                # Extension Popup
│   │   ├── popup.html        # UI разметка с статистикой и кнопками
│   │   ├── popup.ts          # Логика: активация, статус, быстрый выбор
│   │   └── popup.css         # Стили popup окна
│   ├── options/              # Options/Settings Page
│   │   ├── options.html      # Страница настроек расширения
│   │   ├── options.ts        # Логика настроек
│   │   └── options.css       # Стили настроек
│   ├── types/                # TypeScript типы
│   │   ├── index.ts          # Экспорт всех типов
│   │   ├── config.ts         # ParserConfig, Platform, основные типы
│   │   ├── schema.ts         # SchemaField, Schema, типы данных
│   │   ├── selector.ts       # SelectorConfig, ExtractionType
│   │   ├── platform.ts       # Platform, PageType, домены
│   │   ├── messages.ts       # ExtensionMessage union, все сообщения
│   │   └── global.d.ts       # Глобальные типы Chrome API
│   └── utils/                # Утилиты
│       ├── index.ts          # Экспорт утилит
│       ├── selector.ts       # Генерация CSS селекторов, валидация
│       ├── config.ts         # Работа с конфигурациями
│       ├── messaging.ts      # Обёртки для chrome.runtime.sendMessage
│       ├── storage.ts        # Работа с chrome.storage
│       ├── dom.ts            # DOM утилиты, безопасные операции
│       ├── validation.ts     # Валидация конфигов и селекторов
│       └── types.ts          # Type guards и утилиты типов
├── public/                   # Статические ресурсы
│   ├── manifest.json         # Manifest V3 для Chrome
│   └── icons/                # Иконки расширения (16/32/48/128)
├── docs/                     # Документация
│   ├── ARCHITECTURE.md       # Этот файл
│   └── TODO-selector-editor.md # Планы развития
├── patches/                  # Патчи для зависимостей
├── dist/                     # Собранный код (игнорируется git)
└── package.json              # Зависимости и скрипты
```

## Core Architecture

### 1. Background Service Worker
**Файл:** `src/background/background.ts`

**Ответственности:**
- Lifecycle events: onInstalled, onStartup, onSuspend
- Управление активными вкладками (tabs.onActivated, tabs.onUpdated)
- Команды клавиатуры (chrome.commands: toggle-extension, quick-select)
- Обновление иконки action (активно/неактивно)
- Мост для межкомпонентной коммуникации

**Ключевые методы:**
```typescript
- handleMessage(message): Promise<MessageResponse>
- toggleExtension(): отправка ACTIVATE/DEACTIVATE на активную вкладку
- startQuickSelect(): отправка START_SELECTION на активную вкладку
- updateIcon(tabId, isActive): безопасное chrome.action.setIcon
- trackActiveTab(): отслеживание tabs.onActivated/onUpdated
```

**Сообщения:**
- Получает: команды от popup, уведомления от content
- Отправляет: ACTIVATE/DEACTIVATE_EXTENSION в content-script

### 2. Content Script System
**Главный файл:** `src/content/content-script.ts`

**Архитектура:** Координатор + специализированные компоненты
```typescript
ParserConfigContentScript {
  - elementSelector: ElementSelector    // DOM interaction
  - configSidebar: ConfigSidebar       // UI management
  - currentConfig: ParserConfig        // State
}
```

**Ключевые обработчики сообщений:**
```typescript
- ACTIVATE_EXTENSION: показать sidebar, инициализировать конфиг
- DEACTIVATE_EXTENSION: скрыть UI, очистить состояние
- START_SELECTION: запуск ElementSelector для поля
- STOP_SELECTION: остановка выбора, очистка подсветок
- CREATE_FIELD: создание нового поля схемы (из модалки)
- UPDATE_SCHEMA/UPDATE_SELECTOR: обновление конфигурации
- TEST_CONFIG: тестирование всех селекторов на странице
- CLEAR_HIGHLIGHTS: глобальная очистка подсветок
```

**Жизненный цикл:**
1. Инициализация: setupMessageListeners + setupElementSelector
2. Активация: createDefaultConfig или loadConfigFromStorage
3. Взаимодействие: обработка сообщений ↔ обновление UI
4. Сохранение: автосохранение в chrome.storage.local по ключу `config_{domain}`

### 3. Element Selector Engine
**Файл:** `src/content/element-selector.ts`

**Функции:**
- **Hover tracking**: отслеживание mouseover с подсветкой кандидатов
- **Click handling**: выбор элемента по клику с генерацией селектора
- **Keyboard control**: ESC для отмены, Enter для подтверждения
- **CSS Selector Generation**: DevTools-подобный алгоритм
- **Highlight management**: управление классами .pcb-highlight*

**Алгоритм генерации селектора:**
```typescript
1. Поиск ближайшего уникального ID (#id)
2. Сбор стабильных классов (исключая хешированные)
3. Построение пути через структурные селекторы
4. Добавление :nth-child() только при неоднозначности
5. Оптимизация и проверка уникальности
```

**Методы:**
```typescript
- startSelection(config): начать режим выбора
- stopSelection(): остановить выбор
- highlightBySelector(selector): подсветить по CSS селектору
- clearAllHighlights(): убрать все подсветки
- globalCleanup(): глобальная очистка всех .pcb-highlight*
```

### 4. Config Sidebar System
**Главный файл:** `src/content/config-sidebar.ts`

**Архитектура:** Многосекционный UI с навигацией
```typescript
ConfigSidebar {
  Секции:
  - main: обзор конфигурации + история выбора
  - schema: редактор полей схемы
  - selector: детальный редактор селекторов
}
```

**UI Components:**
- **Header**: название проекта + кнопка закрытия
- **Control Panel**: тип страницы + кнопки управления
- **Section Tabs**: навигация между разделами
- **Content Area**: динамический контент по секции
- **Footer**: версия и год

**Ключевые методы:**
```typescript
- show/hide(): управление видимостью
- updateConfig(config): обновление данных + перерисовка
- switchSection(section): переход между разделами с очисткой
- notifyElementSelected(message): реакция на выбор элемента
- openSelectorEditor(fieldName): открытие редактора селектора
```

**Вспомогательный класс:** `src/content/config-sidebar-methods.ts`
```typescript
SidebarUIMethods {
  - showAddFieldDialog(): модальное окно создания поля
  - showEditFieldDialog(): редактирование существующего поля
  - showFieldSelectionPrompt(): выбор поля для выделения
  - exportConfig(): экспорт JSON
  - renderHistoryItem/renderTestResults(): рендер компонентов
  - showNotification(): toast уведомления
}
```

### 5. Popup Interface
**Файлы:** `src/popup/popup.html`, `src/popup/popup.ts`, `src/popup/popup.css`

**Функции:**
- **Статус отображение**: домен, состояние, количество полей/селекторов
- **Управление**: активация/деактивация расширения
- **Быстрые действия**: старт выбора поля, тест конфигурации
- **Индикаторы**: режим выбора, статус sidebar

**UI Секции:**
- **Header**: домен + статус активности
- **Stats Grid**: поля, селекторы, история
- **Action Buttons**: toggle, quick select, test
- **Status Indicators**: selection mode, sidebar state

## Типизация и данные

### Основные типы данных

**ParserConfig** (`src/types/config.ts`):
```typescript
interface ParserConfig {
  id: string;
  platform: Platform;        // домен, имя, baseUrl
  pageType: PageType;         // work_detail, work_list, chapter_list...
  schema: Schema;            // поля для извлечения
  selectors: SelectorMap;    // CSS селекторы для полей
  metadata: ConfigMetadata;  // версия, даты создания/обновления
}
```

**Schema** (`src/types/schema.ts`):
```typescript
interface Schema {
  fields: SchemaField[];     // поля данных
  metadata: SchemaMetadata;  // мета-информация
}

interface SchemaField {
  name: string;              // уникальное имя поля
  type: string;              // тип данных (text, attribute, html, array...)
  required: boolean;         // обязательность поля
  description?: string;      // описание для разработчика
  attribute?: string;        // для type='attribute': имя атрибута
}
```

**SelectorConfig** (`src/types/selector.ts`):
```typescript
interface SelectorConfig {
  primary: string;           // основной CSS селектор
  type: ExtractionType;      // тип извлечения данных
  attribute?: string;        // имя атрибута (для type='attribute')
  fallback?: string[];       // резервные селекторы
}

type ExtractionType = 'text' | 'attribute' | 'html' | 'array' | 'count' | 'exists';
```

### Система сообщений

**ExtensionMessage** (`src/types/messages.ts`) — union всех сообщений:
```typescript
// Активация/управление
ACTIVATE_EXTENSION, DEACTIVATE_EXTENSION, TOGGLE_ACTIVE

// Выбор элементов
START_SELECTION, STOP_SELECTION, ELEMENT_SELECTED

// Управление конфигом
CREATE_FIELD, UPDATE_SCHEMA, UPDATE_SELECTOR, UPDATE_PAGE_TYPE

// Тестирование и отладка
TEST_CONFIG, HIGHLIGHT_ELEMENT, CLEAR_HIGHLIGHTS

// Статус и данные
GET_STATUS, GET_CONFIG, SAVE_CONFIG
```

**MessageResponse**:
```typescript
interface MessageResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
```

## Основные алгоритмы

### CSS Selector Generation (`src/utils/selector.ts`)

**Стратегия DevTools-подобного алгоритма:**

1. **Поиск якоря**: ищем ближайший элемент с уникальным id
2. **Фильтрация классов**: исключаем хешированные (React/Vue) классы
3. **Построение пути**: собираем путь от якоря до цели
4. **Минимизация**: убираем избыточные части
5. **Уникальность**: проверяем и добавляем :nth-child при необходимости

```typescript
// Основные функции
function generateSelector(element: Element): string
function validateSelector(selector: string): boolean
function queryCount(selector: string): number
function isHashedClass(className: string): boolean
```

**Пример генерации:**
```html
<!-- Input -->
<div id="manga-box">
  <div class="content-wrapper">
    <h1 class="title">Название манги</h1>
  </div>
</div>

<!-- Output -->
"#manga-box > .content-wrapper > h1.title"
```

### Element Selection Flow

**Жизненный цикл выбора элемента:**

1. **Инициация**: `START_SELECTION` → `ElementSelector.startSelection()`
2. **Hover Phase**: 
   - Отслеживание `mouseover` событий
   - Добавление `.pcb-highlight-hover` класса
   - Генерация селектора в реальном времени (с кэшированием)
3. **Selection Phase**:
   - Клик → добавление `.pcb-highlight-selected`
   - Генерация финального селектора
   - Отправка `ELEMENT_SELECTED` сообщения
4. **Completion**:
   - Очистка всех подсветок
   - Уведомление через `ConfigSidebar.notifyElementSelected()`
   - Автоматический переход в Selector Editor

### Config Storage Strategy

**Схема хранения:**
```typescript
// Chrome Storage Local
const storageKey = `config_${domain}`; // например: "config_mangalib.me"
const data = {
  [storageKey]: ParserConfig
};
```

**Жизненный цикл:**
1. **Load**: `loadConfigFromStorage(domain)` при активации
2. **Auto-save**: после каждого изменения (CREATE_FIELD, UPDATE_SELECTOR...)
3. **Export**: ручной экспорт через `SidebarUIMethods.exportConfig()`

## UI Architecture

### Sidebar Navigation System

**Трёхсекционная навигация:**
```typescript
type Section = 'main' | 'schema' | 'selector';

// main: Обзор + История
- renderConfigInfo(): статистика платформы/полей
- renderSelectionHistory(): последние 10 выборов

// schema: Редактор полей
- renderFieldCard(): карточки полей с действиями
- renderEmptyFieldsState(): заглушка при отсутствии полей

// selector: Детальный редактор селектора
- renderSelectorEditor(): форма настройки селектора
- performDetailedPreview(): предпросмотр с извлечением значений
```

### Modal System

**Add Field Modal** (`SidebarUIMethods.showAddFieldDialog()`):
- **Type Cards**: визуальные карточки типов данных с примерами
- **Conditional Fields**: поле "Атрибут" только для type='attribute'
- **Validation**: проверка уникальности имени, обязательные поля
- **Integration**: прямая отправка `CREATE_FIELD` сообщения

**Карточки типов:**
```typescript
const typeCards = [
  { type: 'text', icon: '📄', name: 'Текст', desc: 'Название, Автор, Описание' },
  { type: 'attribute', icon: '🔗', name: 'Ссылка/адрес', desc: 'href, src, data-*' },
  { type: 'html', icon: '🌐', name: 'HTML код', desc: 'Разметка узла' },
  { type: 'array', icon: '📋', name: 'Список', desc: 'Жанры, Теги, Авторы' },
  { type: 'count', icon: '🔢', name: 'Количество', desc: 'Число совпадений' },
  { type: 'exists', icon: '✅', name: 'Есть/нет', desc: 'Проверка наличия' }
];
```

### Selector Editor Features

**Полноценный редактор селекторов с:**
- **Pick Element Button**: "🎯 Выбрать элемент" прямо в редакторе
- **Human-friendly Labels**: понятные названия типов извлечения
- **Contextual Tips**: подсказки под селектом типов
- **Live Preview**: предпросмотр с извлечением значений
- **Fallback Management**: добавление/удаление резервных селекторов
- **Auto-refinement**: "✨ Уточнить селектор" при множественных совпадениях

## Development Workflow

### Сборка и запуск

```bash
# Установка зависимостей
npm ci

# Development сборка с watch
npm run dev

# Production сборка
npm run build

# Линтинг
npm run lint

# Проверка типов
npm run type-check
```

### Загрузка в браузер

1. Открыть `chrome://extensions/`
2. Включить "Режим разработчика"
3. "Загрузить распакованное расширение" → выбрать папку `dist/`
4. После каждых изменений: `npm run build` → кнопка "⟳" в extensions

### Отладка

**Три консоли для полного мониторинга:**

1. **Content Script Console**: F12 на целевой странице
   ```typescript
   console.log('ConfigSidebar: Field created', fieldName);
   console.log('ElementSelector: Selector generated', selector);
   ```

2. **Popup Console**: ПКМ на popup → "Проверить элемент"
   ```typescript
   console.log('Popup: Status updated', status);
   console.log('Popup: Message sent', message);
   ```

3. **Background Console**: `chrome://extensions/` → "Проверить представления" на Service Worker
   ```typescript
   console.log('Background: Command received', command);
   console.log('Background: Icon updated', tabId, isActive);
   ```

### Git Workflow

**Ветки:**
- `main`: стабильная версия
- `development`: активная разработка
- `feature/*`: изолированные фичи

**Commit Convention:**
```
feat(scope): краткое описание изменения
fix(scope): исправление бага
chore(scope): рутинные изменения
refactor(scope): рефакторинг без изменения API
docs(scope): обновление документации
```

## Troubleshooting

### Распространённые проблемы

**1. Поле не добавляется в sidebar**
```typescript
// Проверить цепочку:
// 1. Modal отправляет CREATE_FIELD ✓
// 2. content-script.handleCreateField() вызывается ✓  
// 3. Сохранение в storage ✓
// 4. configSidebar.updateConfig() → updateSidebarContent() ?

// Отладка:
console.log('CREATE_FIELD received:', message);
console.log('Field added to schema:', newSchema.fields);
console.log('Sidebar updated with config:', config);
```

**2. Селектор не генерируется/работает неправильно**
```typescript
// Проверить:
// 1. Элемент имеет уникальные признаки (id, стабильные классы)
// 2. Нет конфликтов с динамическими классами фреймворков
// 3. Структура DOM не меняется после генерации

// Отладка:
console.log('Generated selector:', selector);
console.log('Query count:', queryCount(selector));
console.log('Validation result:', validateSelector(selector));
```

**3. Расширение не активируется**
```typescript
// Проверить:
// 1. Manifest V3 permissions (activeTab, storage)
// 2. Content script injection в manifest.json
// 3. CSP политики сайта не блокируют стили

// Отладка:
console.log('Extension activated:', isActive);
console.log('Config initialized:', currentConfig);
console.log('Sidebar shown:', sidebarElement);
```

### Performance Considerations

**DOM Operations:**
- Кэширование hover селекторов для избежания повторных вычислений
- Throttling mouseover событий (debounce 50ms)
- Переиспользование DOM queries через `querySelector` кэш

**Memory Management:**
- История выбора ограничена 10 элементами
- Автоочистка event listeners при hide()
- Удаление временных DOM элементов (модалки, уведомления)

**Storage Optimization:**
- Конфигурации хранятся по доменам (isolation)
- Автосохранение только при изменениях
- Compressed JSON для больших конфигураций (будущее улучшение)

## Extension Ecosystem

### Chrome API Usage

```typescript
// Permissions в manifest.json
"permissions": ["activeTab", "storage", "scripting"]
"host_permissions": ["<all_urls>"] // для content script injection

// Используемые API:
chrome.runtime.onMessage     // межкомпонентная коммуникация
chrome.storage.local         // конфигурации по доменам
chrome.tabs                  // активная вкладка, статус
chrome.action                // иконка, popup
chrome.commands              // клавиатурные шорткаты
```

### Security Model

**Content Security Policy:**
- Inline styles через `style.cssText` (безопасно)
- Event handlers через `addEventListener` (не inline)
- CSS классы через отдельный `.css` файл

**Data Isolation:**
- Конфигурации хранятся по доменам
- Нет доступа к cross-origin данным
- Локальное хранение без внешних запросов

### Build System

**Vite Configuration** (`vite.config.ts`):
```typescript
// Multi-entry build:
entry: {
  'content-script': 'src/content/content-script.ts',
  'background': 'src/background/background.ts',
  'popup': 'src/popup/popup.ts',
  'options': 'src/options/options.ts'
}

// Asset naming для manifest стабильности:
output: {
  entryFileNames: '[name].js',
  chunkFileNames: '[name]-[hash].js',
  assetFileNames: '[name].[ext]'
}
```

## Future Roadmap

### Краткосрочные улучшения (1-2 недели)

1. **Enhanced UX**:
   - Визуальные улучшения модального окна
   - Drag & Drop для реорганизации полей
   - Копирование селекторов одним кликом
   - Умные подсказки для типов данных

2. **Selector Improvements**:
   - Поддержка XPath селекторов
   - Relative селекторы (sibling, parent)
   - Text-based селекторы (contains, starts-with)
   - Visual selector refinement

3. **Testing & Validation**:
   - Пакетное тестирование на множественных страницах
   - Валидация селекторов в реальном времени
   - Предупреждения о нестабильных селекторах
   - A/B тестирование разных стратегий селекторов

### Среднесрочные цели (1-2 месяца)

1. **React-based UI**:
   - Миграция Sidebar на React + Ant Design
   - Компонентная архитектура для переиспользования
   - State management через Context API
   - Типизированные компоненты

2. **Multi-page Workflows**:
   - Переходы между страницами с сохранением состояния
   - Batch конфигурирование для связанных страниц
   - Site profiles с множественными page types
   - Import/export site profiles

3. **Advanced Features**:
   - Динамический контент (AJAX, SPA routing)
   - Поддержка Shadow DOM
   - Custom extraction functions
   - Template system для похожих сайтов

### Долгосрочные планы (3-6 месяцев)

1. **Cross-browser Support**:
   - Firefox через webextension-polyfill
   - Safari Web Extensions
   - Edge Store publication

2. **Cloud Integration**:
   - Синхронизация конфигураций через chrome.storage.sync
   - Shared config repository
   - Community templates
   - Version control для конфигураций

3. **Developer Tools**:
   - JSON Schema generation
   - TypeScript types export
   - API client generation
   - Integration testing framework

## Contributing Guidelines

### Code Style

**TypeScript:**
- Strict mode включён
- Explicit return types для public методов
- Union types с type guards для ExtensionMessage
- Interface over type для объектов
- Consistent naming: PascalCase классы, camelCase методы/переменные

**Структура файлов:**
- Один основной export per file
- Related types в том же файле или dedicated types/
- Utils функции группируются по функциональности
- Константы в UPPER_SNAKE_CASE

**Комментарии:**
```typescript
/**
 * JSDoc для всех public методов
 * @param element - описание параметра
 * @returns описание возвращаемого значения
 */
public generateSelector(element: Element): string { }

// Inline комментарии для сложной логики
// TODO: комментарии для будущих улучшений
// FIXME: для временных решений
```

### Pull Request Process

1. **Feature Branch**: создать от `development`
2. **Implementation**: следовать code style, добавлять тесты
3. **Self-review**: проверить типы, консольные ошибки, performance
4. **PR Creation**: описать изменения, приложить скриншоты UI
5. **Testing**: проверить на 2-3 разных сайтах
6. **Merge**: squash commit в development

### Testing Strategy

**Manual Testing Checklist:**
- [ ] Активация/деактивация работает
- [ ] Sidebar показывается и скрывается
- [ ] Поля создаются и отображаются в схеме
- [ ] Выбор элементов генерирует валидные селекторы
- [ ] Селекторы сохраняются и загружаются
- [ ] Тестирование конфигурации работает
- [ ] Экспорт JSON корректен
- [ ] Работа на разных типах сайтов (SPA, статичные)

**Browser Testing:**
- Chrome 100+ (primary)
- Edge 100+
- Firefox (future, через polyfill)

## API Reference

### ConfigSidebar Public Interface

```typescript
class ConfigSidebar {
  constructor(onMessage: (message: ExtensionMessage) => void)
  
  // Lifecycle
  show(): void
  hide(): void
  
  // State management
  updateConfig(config: ParserConfig): void
  
  // Notifications
  notifyElementSelected(message: ElementSelectedMessage): void
  notifySelectionCancelled(fieldName: string): void
  notifyTestResults(results: TestResult[]): void
}
```

### ElementSelector Public Interface

```typescript
class ElementSelector {
  // Selection control
  startSelection(config: SelectionConfig): void
  stopSelection(): void
  
  // Highlighting
  highlightBySelector(selector: string): void
  clearAllHighlights(): void
  globalCleanup(): void
}

interface SelectionConfig {
  fieldName: string;
  fieldType: string;
  onElementSelected: (element: Element, selector: any) => void;
  onSelectionCancelled: () => void;
}
```

### SidebarUIMethods Static Interface

```typescript
class SidebarUIMethods {
  // Dialogs
  static showAddFieldDialog(config: ParserConfig, onMessage: Function): void
  static showEditFieldDialog(config: ParserConfig, fieldName: string, onMessage: Function): void
  static showFieldSelectionPrompt(config: ParserConfig, onMessage: Function): void
  
  // UI operations
  static exportConfig(config: ParserConfig): void
  static showNotification(text: string, type?: 'success'|'error'|'warning'): void
  
  // Rendering
  static renderHistoryItem(message: ElementSelectedMessage): string
  static renderTestResults(results: TestResult[]): string
}
```

### Utility Functions

```typescript
// src/utils/selector.ts
function generateSelector(element: Element): string
function validateSelector(selector: string): boolean
function queryCount(selector: string): number
function isHashedClass(className: string): boolean

// src/utils/config.ts
function validateConfig(config: ParserConfig): ValidationResult
function mergeConfigs(base: ParserConfig, override: Partial<ParserConfig>): ParserConfig
function exportConfigToJSON(config: ParserConfig): string

// src/utils/storage.ts
async function saveConfig(domain: string, config: ParserConfig): Promise<void>
async function loadConfig(domain: string): Promise<ParserConfig | null>
async function listConfigs(): Promise<string[]>

// src/content/config-sidebar-helpers.ts
function getDefaultSchemaField(name: string, type: string): SchemaField
function generateUniqueFieldName(existingNames: string[], baseName: string): string
function formatTime(timestamp: number): string
function truncateSelector(selector: string, maxLength: number): string
function isValidSelector(selector: string): boolean
```

---

## Current Implementation Status

### ✅ Completed Features
- [x] Базовая архитектура Content Script + Background + Popup
- [x] Element Selection с hover/click navigation
- [x] CSS Selector generation (DevTools-алгоритм)
- [x] Multi-section Sidebar (main/schema/selector)
- [x] Modal "Add Field" dialog с типизированными карточками
- [x] Selector Editor с preview и fallback management
- [x] Human-friendly extraction type labels + tips
- [x] Storage per domain с автосохранением
- [x] Config testing на текущей странице
- [x] JSON export functionality
- [x] Notifications system
- [x] History tracking (последние 10 выборов)

### 🔄 In Progress
- [ ] Debugging CREATE_FIELD handler (поля не добавляются)
- [ ] UI refinements для модального окна
- [ ] Error handling improvements

### 📋 Planned Next
- [ ] Pick Element button интеграция в Selector Editor
- [ ] Batch field creation workflow
- [ ] Selector optimization suggestions
- [ ] Export/Import config files
- [ ] React migration planning

---

Этот документ покрывает все аспекты проекта для продолжения разработки. При изменениях архитектуры обновляйте соответствующие разделы.
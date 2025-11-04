# Parser Config Builder

🚀 **Визуальное создание конфигураций парсеров для сайтов манги и комиксов**

Browser extension для создания JSON конфигураций парсеров без программирования.

## ✨ Возможности

- 🎯 **Визуальное выделение элементов** - кликайте по элементам на странице
- 📊 **Умная генерация селекторов** - автоматические CSS/XPath селекторы с fallback
- 🔧 **Конструктор схемы данных** - создание типизированных полей
- ✅ **Тестирование конфигов** - проверка работы парсера на реальных страницах
- 📤 **Экспорт JSON** - готовые конфиги для использования в парсерах
- 🔄 **Версионирование** - управление версиями конфигураций

## 🛠️ Технологии

- **Frontend**: React 18 + TypeScript
- **UI**: Ant Design
- **Build**: Vite
- **Extension**: Manifest V3
- **Validation**: Zod

## 🚀 Быстрый старт

### Разработка

```bash
# Установка зависимостей
npm install

# Режим разработки (watch mode)
npm run dev

# Сборка для продакшена
npm run build

# Линтинг
npm run lint
```

### Установка в браузер

1. Соберите расширение: `npm run build`
2. Откройте Chrome → Extensions → Developer mode
3. Нажмите "Load unpacked" и выберите папку `dist/`

## 📖 Использование

1. **Откройте целевой сайт** (например, a.zazaza.me)
2. **Активируйте расширение** через иконку в браузере
3. **Создайте схему данных** - добавьте поля с типами
4. **Выделите элементы** - кликните по элементам на странице
5. **Протестируйте конфиг** - проверьте извлечение данных
6. **Экспортируйте JSON** - сохраните готовую конфигурацию

## 🏗️ Архитектура

```
src/
├── background/          # Background Service Worker
├── content/            # Content Scripts
├── popup/              # Extension Popup
├── sidebar/            # Main UI (боковая панель)
├── components/         # React компоненты
├── types/              # TypeScript типы
└── utils/              # Утилиты
```

## 📝 Конфигурация парсера

Пример созданного конфига:

```json
{
  "platform": {
    "name": "Zazaza",
    "domain": "a.zazaza.me",
    "version": "1.0.0"
  },
  "selectors": {
    "title": {
      "primary": ".manga-title-main",
      "fallback": ["h1", ".title"],
      "type": "string"
    },
    "rating": {
      "primary": ".user-rating [data-score]",
      "type": "number",
      "extraction": "attribute:data-score"
    }
  }
}
```

## 🤝 Участие в разработке

1. Fork репозитория
2. Создайте feature branch: `git checkout -b feature/amazing-feature`
3. Commit изменения: `git commit -m 'Add amazing feature'`
4. Push в branch: `git push origin feature/amazing-feature`
5. Создайте Pull Request

## 📄 Лицензия

MIT License - см. [LICENSE](LICENSE) файл.

---

**Сделано с ❤️ для сообщества любителей манги**

/**
 * Обновить иконку расширения
 */
private async updateIcon(tabId: number, isActive?: boolean): Promise<void> {
  try {
    // Используем compiled assets из корня dist/icons
    const base = 'icons/icon';
    const activeBase = 'icons/icon-active';
    const path = isActive ? activeBase : base;

    // Пытаемся поставить иконку; если active-иконки нет — fallback на обычную
    await chrome.action.setIcon({
      tabId,
      path: {
        16: `${path}-16.png`,
        32: `${path}-32.png`,
        48: `${path}-48.png`,
        128: `${path}-128.png`
      }
    });
  } catch (e1) {
    console.warn('Failed to set active icon, fallback to default:', e1);
    try {
      await chrome.action.setIcon({
        tabId,
        path: {
          16: `icons/icon-16.png`,
          32: `icons/icon-32.png`,
          48: `icons/icon-48.png`,
          128: `icons/icon-128.png`
        }
      });
    } catch (e2) {
      console.error('Failed to update icon:', e2);
    }
  }
}

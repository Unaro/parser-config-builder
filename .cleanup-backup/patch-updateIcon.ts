/**
 * Обновить иконку расширения (standalone util for MV3 background)
 */
export async function updateIcon(tabId: number, isActive?: boolean): Promise<void> {
  try {
    const base = 'icons/icon';
    const activeBase = 'icons/icon-active';
    const path = isActive ? activeBase : base;

    await chrome.action.setIcon({
      tabId,
      path: {
        16: `${path}-16.png`,
        32: `${path}-32.png`,
        48: `${path}-48.png`,
        128: `${path}-128.png`,
      },
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
          128: `icons/icon-128.png`,
        },
      });
    } catch (e2) {
      console.error('Failed to update icon:', e2);
    }
  }
}

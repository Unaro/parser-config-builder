/**
 * Background Script
 * @module background
 * @version 1.0.0
 */

import { browser } from '@lib/utils/browser-api';
import { configRepository } from '@lib/storage/config-repository';
import type { ParserConfig } from '@lib/types/parser.types';
import type Browser from 'webextension-polyfill';

console.log('[Background] Parser Config Builder loaded');

browser.runtime.onMessage.addListener((message: unknown, _sender: Browser.Runtime.MessageSender) => {
  console.log('[Background] Message received:', message);
  
  if (isConfigCreatedMessage(message)) {
    return handleConfigCreated(message.config);
  }
  
  if (isConfigUpdatedMessage(message)) {
    return handleConfigUpdated(message.config);
  }
  
  if (isConfigDeletedMessage(message)) {
    return handleConfigDeleted(message.configId);
  }
  
  return undefined;
});

function isConfigCreatedMessage(message: unknown): message is { type: 'CONFIG_CREATED'; config: ParserConfig } {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    (message as { type: unknown }).type === 'CONFIG_CREATED'
  );
}

function isConfigUpdatedMessage(message: unknown): message is { type: 'CONFIG_UPDATED'; config: ParserConfig } {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    (message as { type: unknown }).type === 'CONFIG_UPDATED'
  );
}

function isConfigDeletedMessage(message: unknown): message is { type: 'CONFIG_DELETED'; configId: string } {
  return (
    typeof message === 'object' &&
    message !== null &&
    'type' in message &&
    (message as { type: unknown }).type === 'CONFIG_DELETED'
  );
}

async function handleConfigCreated(config: ParserConfig): Promise<{ success: boolean }> {
  try {
    console.log('[Background] Saving new config:', config.name);
    await configRepository.save(config);
    console.log('[Background] Config saved successfully');
    return { success: true };
  } catch (error) {
    console.error('[Background] Error saving config:', error);
    return { success: false };
  }
}

async function handleConfigUpdated(config: ParserConfig): Promise<{ success: boolean }> {
  try {
    console.log('[Background] Updating config:', config.name);
    await configRepository.save(config);
    return { success: true };
  } catch (error) {
    console.error('[Background] Error updating config:', error);
    return { success: false };
  }
}

async function handleConfigDeleted(configId: string): Promise<{ success: boolean }> {
  try {
    console.log('[Background] Deleting config:', configId);
    await configRepository.delete(configId);
    return { success: true };
  } catch (error) {
    console.error('[Background] Error deleting config:', error);
    return { success: false };
  }
}

browser.runtime.onInstalled.addListener((details: { reason: string }) => {
  console.log('[Background] Extension installed:', details.reason);
  
  if (details.reason === 'install') {
    void browser.tabs.create({
      url: browser.runtime.getURL('src/options/index.html')
    });
  }
});

/**
 * Config Sidebar - ensure highlight cleanup on section changes and close
 */

import type { ParserConfig, ElementSelectedMessage, PageType, TestResult } from '@/types';
import { SidebarUIMethods } from './config-sidebar-methods';

// ...existing imports

export class ConfigSidebar {
  // ...existing fields
  private cleanupHighlights(): void {
    try {
      // Сообщаем content-script очистить все подсветки
      this.onMessage({ type: 'CLEAR_HIGHLIGHTS', id: `sidebar_${Date.now()}`, timestamp: Date.now() });
    } catch {}
  }

  public hide(): void {
    if (!this.isVisible || !this.sidebarElement) return;
    this.cleanupHighlights();
    this.sidebarElement.remove();
    this.sidebarElement = null;
    this.isVisible = false;
    this.currentSection = 'main';
    this.selectedField = null;
  }

  private switchSection(newSection: 'main'|'schema'|'selector'): void {
    if (this.currentSection === newSection) return;
    this.cleanupHighlights();
    this.currentSection = newSection;
    if (newSection !== 'selector') this.selectedField = null;
    this.updateSidebarContent();
  }

  private bindBreadcrumbEvents(): void {
    const breadcrumbs = this.sidebarElement!.querySelectorAll('.pcb-breadcrumb');
    breadcrumbs.forEach(crumb => {
      crumb.addEventListener('click', (e) => {
        const section = (e.target as HTMLElement).getAttribute('data-section') as any;
        this.switchSection(section);
      });
    });
    const backBtn = this.sidebarElement!.querySelector('#pcb-back-to-schema');
    if (backBtn) backBtn.addEventListener('click', () => this.switchSection('schema'));
  }

  private bindTabEvents(): void {
    const tabs = this.sidebarElement!.querySelectorAll('.pcb-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const section = (e.target as HTMLElement).getAttribute('data-section') as any;
        this.switchSection(section);
      });
    });
  }

  private bindControlPanelEvents(): void {
    // ...existing bindings
    const stopBtn = this.sidebarElement!.querySelector('#pcb-stop-selection');
    if (stopBtn) stopBtn.addEventListener('click', () => {
      this.cleanupHighlights();
      this.onMessage({ type: 'STOP_SELECTION', id: `sidebar_${Date.now()}`, timestamp: Date.now() });
    });
  }
}

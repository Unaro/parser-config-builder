/**
 * Config Exporter v4.3 - с Pre-Parse документацией
 * @module components/features/ConfigExporter
 */

import { useState } from 'react';
import type { ParserConfig, PreParseAction } from '@lib/types/parser.types';

interface ConfigExporterProps {
  config: ParserConfig;
  onClose?: () => void;
  onBack?: () => void;
}

function formatPreParseAction(action: PreParseAction): string {
  const parts = [`Type: ${action.type}`];
  if (action.selector) parts.push(`Selector: "${action.selector}"`);
  if (action.timeout) parts.push(`Timeout: ${action.timeout}ms`);
  if (action.executeOnce) parts.push('Execute Once');
  return parts.join(', ');
}

export function ConfigExporter({ config, onClose, onBack }: ConfigExporterProps) {
  const [format, setFormat] = useState<'json' | 'yaml' | 'markdown'>('json');

  const generateMarkdownDoc = (): string => {
    let md = `# ${config.name}\n\n`;
    md += `**Version:** ${config.version}\n`;
    md += `**Target:** ${config.targetUrl}\n\n`;
    
    config.pages.forEach(page => {
      md += `## Page: ${page.name}\n\n`;
      md += `**URL Pattern:** \`${page.urlPattern}\`\n\n`;
      
      if (page.tabSelector) {
        md += `**Tab Selector:** \`${page.tabSelector}\`\n\n`;
      }
      
      // Page-level Pre-Parse Actions
      if (page.preParseActions && page.preParseActions.length > 0) {
        md += `### ���️ Page Pre-Parse Actions\n\n`;
        md += `Execute these actions BEFORE parsing any fields:\n\n`;
        page.preParseActions.forEach((action, idx) => {
          md += `${idx + 1}. **${action.type}**\n`;
          if (action.selector) md += `   - Selector: \`${action.selector}\`\n`;
          if (action.timeout) md += `   - Timeout: ${action.timeout}ms\n`;
          md += `\n`;
        });
      }
      
      // Common Fields
      if (page.commonFields.length > 0) {
        md += `### Common Fields (on all subpages)\n\n`;
        page.commonFields.forEach(field => {
          md += `#### ${field.name}\n`;
          md += `- **Type:** ${field.type}`;
          if (field.arrayItemType) md += ` (Array of ${field.arrayItemType})`;
          md += `\n`;
          md += `- **Selector:** \`${field.selector}\`\n`;
          
          if (field.loadConfig && field.loadConfig.strategy !== 'none') {
            md += `- **Load Strategy:** ${field.loadConfig.strategy}\n`;
            if (field.loadConfig.buttonSelector) {
              md += `  - Button: \`${field.loadConfig.buttonSelector}\`\n`;
            }
            md += `  - Max Iterations: ${field.loadConfig.maxIterations || 5}\n`;
            md += `  - Wait: ${field.loadConfig.waitAfterAction || 1000}ms\n`;
          }
          
          if (field.preParseActions && field.preParseActions.length > 0) {
            md += `- **Pre-Parse Actions:**\n`;
            field.preParseActions.forEach(action => {
              md += `  - ${formatPreParseAction(action)}\n`;
            });
          }
          
          md += `\n`;
        });
      }
      
      // SubPages
      if (page.subPages && page.subPages.length > 0) {
        page.subPages.forEach(subPage => {
          md += `### SubPage: ${subPage.name}\n\n`;
          md += `**URL:** \`${subPage.urlPattern}\`\n\n`;
          
          if (subPage.preParseActions && subPage.preParseActions.length > 0) {
            md += `#### ���️ SubPage Pre-Parse Actions\n\n`;
            subPage.preParseActions.forEach((action, idx) => {
              md += `${idx + 1}. **${action.type}**\n`;
              if (action.selector) md += `   - Selector: \`${action.selector}\`\n`;
              md += `\n`;
            });
          }
          
          subPage.fields.forEach(field => {
            md += `#### ${field.name}\n`;
            md += `- **Type:** ${field.type}`;
            if (field.arrayItemType) md += ` (Array of ${field.arrayItemType})`;
            md += `\n`;
            md += `- **Selector:** \`${field.selector}\`\n`;
            
            if (field.loadConfig && field.loadConfig.strategy !== 'none') {
              md += `- **Load Strategy:** ${field.loadConfig.strategy}\n`;
              if (field.loadConfig.buttonSelector) {
                md += `  - Button: \`${field.loadConfig.buttonSelector}\`\n`;
              }
            }
            
            if (field.preParseActions && field.preParseActions.length > 0) {
              md += `- **Pre-Parse:**\n`;
              field.preParseActions.forEach(action => {
                md += `  - ${formatPreParseAction(action)}\n`;
              });
            }
            
            md += `\n`;
          });
        });
      }
    });
    
    return md;
  };

  const handleExport = () => {
    const validated: ParserConfig = {
      ...config,
      pages: config.pages.map(p => ({
        ...p,
        commonFields: p.commonFields || p.fields || [],
        subPages: p.subPages || [],
        fields: []
      }))
    };

    let data: string;
    let filename: string;
    
    if (format === 'markdown') {
      data = generateMarkdownDoc();
      filename = `${config.name}.md`;
    } else {
      data = format === 'json' 
        ? JSON.stringify(validated, null, 2)
        : '# YAML not implemented';
      filename = `${config.name}.${format}`;
    }
    
    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCloseAction = () => {
    if (onClose) onClose();
    if (onBack) onBack();
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>Export Configuration</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Format</label>
          <select 
            value={format} 
            onChange={(e) => setFormat(e.target.value as 'json' | 'yaml' | 'markdown')}
            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
          >
            <option value="json">JSON (config file)</option>
            <option value="markdown">Markdown (documentation)</option>
            <option value="yaml">YAML</option>
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Details</div>
          <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '6px', fontSize: '13px' }}>
            <div><strong>Name:</strong> {config.name}</div>
            <div><strong>Version:</strong> {config.version}</div>
            <div><strong>Pages:</strong> {config.pages.length}</div>
            <div><strong>Target:</strong> {config.targetUrl}</div>
          </div>
        </div>

        {format === 'markdown' && (
          <div style={{ background: '#fef3c7', border: '1px solid #fde68a', padding: '12px', borderRadius: '6px', marginBottom: '20px', fontSize: '13px' }}>
            <strong>��� Markdown Documentation</strong>
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#78350f' }}>
              • Readable format for humans
              <br />
              • Includes all Pre-Parse Actions
              <br />
              • Describes Load Strategies
              <br />
              • Perfect for documentation
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={handleCloseAction} 
            style={{ flex: 1, padding: '12px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '6px', fontWeight: 500, cursor: 'pointer' }}
            type="button"
          >
            Back
          </button>
          <button 
            onClick={handleExport} 
            style={{ flex: 1, padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 500, cursor: 'pointer' }}
            type="button"
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
}

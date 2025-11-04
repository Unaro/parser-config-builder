/**
 * Утилиты для генерации селекторов (DevTools-like)
 */

import type { GeneratedSelector, SelectorStrategy } from '@/types';

const HASH_LIKE = /^(?:[a-z]{1,3}-)?[a-z0-9]{6,}$/i;
const PREFERRED_ATTRS = ['data-testid','data-test','data-qa','data-id','data-key','aria-label','role','itemprop'];

export function generateSelectors(element: Element): GeneratedSelector[] {
  const list: GeneratedSelector[] = [];

  // 1) ID
  if (element.id && isUnique(`#${cssEscape(element.id)}`)) {
    list.push(pack(`#${cssEscape(element.id)}`, 'id', 1));
  }

  // 2) Preferred attributes
  for (const attr of PREFERRED_ATTRS) {
    const val = element.getAttribute(attr);
    if (val && isUnique(`[${attr}="${cssEscape(val)}"]`)) {
      list.push(pack(`[${attr}="${cssEscape(val)}"]`, 'data-attribute', 0.95));
    }
  }

  // 3) Full path like DevTools
  const fullPath = buildFullPathSelector(element);
  if (fullPath) list.push(pack(fullPath, 'position', 0.9));

  // 4) Class structure (filter hashed)
  const classStruct = buildClassStructureSelector(element);
  if (classStruct) list.push(pack(classStruct, 'class', 0.75));

  // 5) Hybrid (anchor with id/attr + path)
  const hybrid = buildHybridSelector(element);
  if (hybrid) list.push(pack(hybrid, 'semantic', 0.85));

  return dedupe(list).sort((a,b)=> (b.confidence - a.confidence) || (a.selector.length - b.selector.length));
}

function pack(selector: string, strategy: SelectorStrategy, confidence: number): GeneratedSelector {
  return { selector, strategy, confidence, uniqueness: uniqueness(selector), stability: stability(strategy), element: document.querySelector(selector) as Element };
}

function isUnique(sel: string): boolean { try { return document.querySelectorAll(sel).length === 1; } catch { return false; } }
function uniqueness(sel: string): number { try { const n = document.querySelectorAll(sel).length; return n===1?1:1/Math.max(n,2); } catch { return 0; } }
function stability(s: SelectorStrategy): number { const m: Record<SelectorStrategy, number> = { 'data-attribute':0.95,'semantic':0.9,'id':0.9,'class':0.7,'tag':0.5,'xpath':0.4,'position':0.9,'text-content':0.25,'manual':0.6 }; return m[s] ?? 0.5; }

function buildFullPathSelector(el: Element): string | null {
  const parts: string[] = [];
  let node: Element | null = el;
  while (node && node.nodeType === 1 && node.tagName.toLowerCase() !== 'html') {
    const seg = segment(node);
    if (!seg) return null;
    parts.unshift(seg);
    node = node.parentElement;
  }
  parts.unshift('html');
  return parts.join(' > ');
}

function segment(node: Element): string | null {
  const tag = node.tagName.toLowerCase();

  if (node.id && isUnique(`#${cssEscape(node.id)}`)) {
    return `#${cssEscape(node.id)}`;
  }

  for (const attr of PREFERRED_ATTRS) {
    const val = node.getAttribute(attr);
    if (val && isUnique(`[${attr}="${cssEscape(val)}"]`)) return `${tag}[${attr}="${cssEscape(val)}"]`;
  }

  const classes = Array.from(node.classList).filter(c => !HASH_LIKE.test(c)).slice(0,2);
  const cls = classes.length ? `.${classes.map(cssEscape).join('.')}` : '';
  const nth = nthChild(node);
  const nthPart = nth > 1 ? `:nth-child(${nth})` : '';
  return `${tag}${cls}${nthPart}`;
}

function nthChild(node: Element): number {
  const parent = node.parentElement; if (!parent) return 1;
  const tag = node.tagName.toLowerCase(); let idx = 0; let seen = 0;
  for (const ch of Array.from(parent.children)) {
    if (ch.tagName.toLowerCase() === tag) { seen++; if (ch===node) idx = seen; }
  }
  return idx || 1;
}

function buildClassStructureSelector(el: Element): string | null {
  const chain: string[] = [];
  let node: Element | null = el; let depth = 0;
  while (node && depth < 5) {
    const tag = node.tagName.toLowerCase();
    const classes = Array.from(node.classList).filter(c => !HASH_LIKE.test(c));
    chain.unshift(classes.length ? `${tag}.${classes.map(cssEscape).join('.')}` : tag);
    node = node.parentElement; depth++;
  }
  const sel = chain.join(' > ');
  try { return document.querySelectorAll(sel).length ? sel : null; } catch { return null; }
}

function buildHybridSelector(el: Element): string | null {
  let anchor: Element | null = el;
  while (anchor) {
    if (anchor.id && isUnique(`#${cssEscape(anchor.id)}`)) break;
    const a = PREFERRED_ATTRS.find(x => anchor!.getAttribute(x));
    if (a) { const v = anchor!.getAttribute(a)!; if (isUnique(`[${a}="${cssEscape(v)}"]`)) break; }
    anchor = anchor.parentElement;
  }
  if (!anchor) return null;
  const anchorSel = anchor.id ? `#${cssEscape(anchor.id)}` : (()=>{ const a = PREFERRED_ATTRS.find(x => anchor!.getAttribute(x))!; const v = anchor!.getAttribute(a)!; return `[${a}="${cssEscape(v)}"]`; })();
  const path = pathFrom(anchor, el);
  const sel = `${anchorSel} > ${path}`;
  try { return document.querySelectorAll(sel).length ? sel : null; } catch { return null; }
}

function pathFrom(from: Element, to: Element): string {
  const parts: string[] = [];
  let node: Element | null = to;
  while (node && node !== from) {
    parts.unshift(segment(node) || node.tagName.toLowerCase());
    node = node.parentElement;
  }
  return parts.join(' > ');
}

function cssEscape(input: string): string {
  return input.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function dedupe(items: GeneratedSelector[]): GeneratedSelector[] {
  const seen = new Set<string>();
  const out: GeneratedSelector[] = [];
  for (const it of items) {
    if (!seen.has(it.selector)) { seen.add(it.selector); out.push(it); }
  }
  return out;
}

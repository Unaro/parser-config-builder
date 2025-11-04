/**
 * DevTools-accurate selector generator v2: strict full path to html with precise :nth-child mapping to the exact target node.
 */

import type { GeneratedSelector, SelectorStrategy } from '@/types';

const HASH_CLASS_REGEX = /^(?:[a-z]{1,3}[-_])?[a-z0-9]{6,}$/i;
const STABLE_ATTRS = ['data-testid','data-test','data-qa','data-id','data-key','aria-label','role','itemprop'];

export function generateSelectors(element: Element): GeneratedSelector[] {
  const full = buildAbsoluteToHtml(element);
  const out: GeneratedSelector[] = [];
  if (full) out.push(pack(full, 'position', 0.95, element));

  // shortcuts if truly unique
  if (element.id && isUnique(`#${cssEscape(element.id)}`)) out.push(pack(`#${cssEscape(element.id)}`, 'id', 1, element));
  for (const a of STABLE_ATTRS) {
    const v = element.getAttribute(a);
    if (v && isUnique(`[${a}="${cssEscape(v)}"]`)) out.push(pack(`[${a}="${cssEscape(v)}"]`, 'data-attribute', 0.95, element));
  }

  return dedupe(out).sort((a,b)=> (b.confidence - a.confidence) || (a.selector.length - b.selector.length));
}

/** Build absolute path: html > body > ... > target. Never skip intermediate ancestors. */
function buildAbsoluteToHtml(target: Element): string | null {
  const chain: Element[] = [];
  let node: Element | null = target;
  while (node && node.nodeType === 1) {
    chain.unshift(node);
    if (node.tagName.toLowerCase() === 'html') break;
    node = node.parentElement;
  }
  if (!chain.length || chain[0].tagName.toLowerCase() !== 'html') return null;

  // Build segments and compute exact nth-child for each level
  const segs: string[] = [];
  for (let i = 0; i < chain.length; i++) {
    const el = chain[i];
    if (i === 0) { segs.push('html'); continue; }
    const seg = segmentWithNth(el);
    segs.push(seg);
  }
  let selector = segs.join(' > ');

  // Ensure selector points exactly to target; if not, refine
  selector = enforceTarget(selector, target);
  return selector;
}

/** tag + up to 2 stable classes + :nth-child(index among ALL children) */
function segmentWithNth(el: Element): string {
  if (el.id && isUnique(`#${cssEscape(el.id)}`)) return `#${cssEscape(el.id)}`;
  const tag = el.tagName.toLowerCase();
  const classes = Array.from(el.classList).filter(c=>!HASH_CLASS_REGEX.test(c)).slice(0,2);
  const classPart = classes.length ? `.${classes.map(cssEscape).join('.')}` : '';
  const nth = indexAmongAllSiblings(el);
  const nthPart = nth > 1 ? `:nth-child(${nth})` : '';
  return `${tag}${classPart}${nthPart}`;
}

function indexAmongAllSiblings(el: Element): number {
  const p = el.parentElement; if (!p) return 1;
  const kids = Array.from(p.children);
  const idx = kids.indexOf(el);
  return idx >= 0 ? idx + 1 : 1;
}

/** Validate selector maps to the exact target; if multiple or zero matches, refine bottom-up. */
function enforceTarget(selector: string, target: Element): string {
  // If selector resolves to exactly the target, done
  const nodes = safeQueryAll(selector);
  if (nodes.length === 1 && nodes[0] === target) return selector;

  // If zero or multiple, try to replace segments that are too generic by adding :nth-child where missing
  const parts = selector.split(' > ');
  for (let i = parts.length - 1; i >= 0; i--) {
    if (parts[i].startsWith('#')) continue; // id segment is already specific
    if (!/\:nth-child\(\d+\)/.test(parts[i])) {
      // compute real nth for this level by reading DOM
      const parentSel = parts.slice(0, i).join(' > ');
      const parentEl = parentSel ? (document.querySelector(parentSel) as Element | null) : null;
      const elSelBare = parts[i];
      const thisEl = resolveElementByPrefix(parts, i); // actual element at this level along the target path
      const nth = thisEl ? indexAmongAllSiblings(thisEl) : 1;
      parts[i] = `${elSelBare}:nth-child(${nth})`;
      const cand = parts.join(' > ');
      const candNodes = safeQueryAll(cand);
      if (candNodes.length === 1 && candNodes[0] === target) return cand;
    }
  }

  // As a last resort, switch all non-id segments to pure tag:nth-child to fully match DevTools
  const fallback = parts.map(p => p.startsWith('#') || p === 'html' ? p : p.replace(/\.[^:]+/g,'').replace(/\:nth-child\(\d+\)/,'') )
    .map((p, i, arr) => {
      if (p.startsWith('#') || p === 'html') return p;
      // recompute nth for each level against the real chain to the target
      const elAtLevel = resolveElementByPrefix(arr, i);
      const nth = elAtLevel ? indexAmongAllSiblings(elAtLevel) : 1;
      return `${p}:nth-child(${nth})`;
    }).join(' > ');
  const fbNodes = safeQueryAll(fallback);
  if (fbNodes.length === 1 && fbNodes[0] === target) return fallback;

  return selector; // return best-effort; UI can refine further
}

/** Resolve the actual DOM element represented by selector prefix up to index i, following the true target chain */
function resolveElementByPrefix(parts: string[], idx: number): Element | null {
  // Build prefix that points to the real ancestor at this level by querying progressively
  let prefix = parts.slice(0, idx + 1).join(' > ');
  // Try direct query first
  const node = document.querySelector(prefix) as Element | null;
  if (node) return node;
  // If fails (missing nth), try adding :nth-child based on real DOM walking
  // degrade to tag-only then add nth by matching child order
  const parentSel = parts.slice(0, idx).join(' > ');
  const parentEl = parentSel ? (document.querySelector(parentSel) as Element | null) : null;
  if (!parentEl) return null;
  // strip classes/id in current seg to get tag
  const tagMatch = parts[idx].match(/^#|^html|^([a-z0-9\-]+)/i);
  const tag = tagMatch && !parts[idx].startsWith('#') && parts[idx] !== 'html' ? tagMatch[1].toLowerCase() : '';
  if (!tag) return null;
  const child = Array.from(parentEl.children).find(ch => ch.tagName.toLowerCase() === tag) as Element | undefined;
  return child || null;
}

function safeQueryAll(sel: string): Element[] { try { return Array.from(document.querySelectorAll(sel)); } catch { return []; } }

export function validateSelector(selector: string): boolean { try { document.querySelector(selector); return true; } catch { return false; } }
export function queryCount(selector: string): number { try { return document.querySelectorAll(selector).length; } catch { return 0; } }

function isUnique(sel: string): boolean { try { return document.querySelectorAll(sel).length === 1; } catch { return false; } }
function cssEscape(v: string): string { return v.replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/'/g,"\\'"); }

function pack(selector: string, strategy: SelectorStrategy, confidence: number, el: Element): GeneratedSelector {
  const n = queryCount(selector); return { selector, strategy, confidence, uniqueness: n===1?1:1/Math.max(n,2), stability: strategy==='position'?0.9:0.85, element: el };
}

function dedupe(items: GeneratedSelector[]): GeneratedSelector[] {
  const seen = new Set<string>(); const out: GeneratedSelector[] = [];
  for (const it of items) if (!seen.has(it.selector)) { seen.add(it.selector); out.push(it); }
  return out;
}

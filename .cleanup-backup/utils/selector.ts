/**
 * DevTools-like selector generator v3: start at nearest unique ID, keep semantic classes, add :nth-child only when needed.
 */

import type { GeneratedSelector, SelectorStrategy } from '@/types';

const HASH_CLASS_REGEX = /^(?:[a-z]{1,3}[-_])?[a-z0-9]{6,}$/i;
const STABLE_ATTRS = ['data-testid','data-test','data-qa','data-id','data-key','aria-label','role','itemprop'];

export function generateSelectors(element: Element): GeneratedSelector[] {
  const full = buildFromUniqueIdAnchor(element);
  const out: GeneratedSelector[] = [];
  if (full) out.push(pack(full, 'position', 0.95, element));

  // shortcuts
  if (element.id && isUnique(`#${cssEscape(element.id)}`)) out.push(pack(`#${cssEscape(element.id)}`, 'id', 1, element));
  for (const a of STABLE_ATTRS) {
    const v = element.getAttribute(a);
    if (v && isUnique(`[${a}="${cssEscape(v)}"]`)) out.push(pack(`[${a}="${cssEscape(v)}"]`, 'data-attribute', 0.95, element));
  }

  return dedupe(out).sort((a,b)=> (b.confidence - a.confidence) || (a.selector.length - b.selector.length));
}

/** Build path starting at nearest unique-ID ancestor (inclusive), not html. */
function buildFromUniqueIdAnchor(target: Element): string | null {
  // 1) Find nearest ancestor with unique id
  let anchor: Element | null = target;
  while (anchor && !(anchor.id && isUnique(`#${cssEscape(anchor.id)}`))) {
    anchor = anchor.parentElement;
  }
  // If no id-anchor found, fall back to absolute html path
  if (!anchor) return buildAbsoluteToHtml(target);

  const chain: Element[] = [];
  let node: Element | null = target;
  while (node && node !== anchor) { chain.unshift(node); node = node.parentElement; }
  // include anchor as first segment
  const segments: string[] = [`#${cssEscape(anchor.id)}`];

  for (const el of chain) segments.push(segmentSmart(el));

  let selector = segments.join(' > ');
  // validate uniqueness to the exact target
  selector = ensurePointsToTarget(selector, target);
  return selector;
}

/** Fallback absolute path to html if no unique id found */
function buildAbsoluteToHtml(target: Element): string | null {
  const chain: Element[] = [];
  let node: Element | null = target;
  while (node && node.nodeType === 1) { chain.unshift(node); if (node.tagName.toLowerCase()==='html') break; node = node.parentElement; }
  if (!chain.length || chain[0].tagName.toLowerCase() !== 'html') return null;
  const segs: string[] = ['html'];
  for (let i=1;i<chain.length;i++) segs.push(segmentSmart(chain[i]));
  let selector = segs.join(' > ');
  selector = ensurePointsToTarget(selector, target);
  return selector;
}

/** tag + ALL stable (non-hash) classes, add :nth-child ONLY if needed to disambiguate among siblings with same tag+classes */
function segmentSmart(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const stableClasses = Array.from(el.classList).filter(c=>!HASH_CLASS_REGEX.test(c));
  const classPart = stableClasses.length ? `.${stableClasses.map(cssEscape).join('.')}` : '';

  // Decide if nth-child needed by checking siblings with same tag and same classes
  const p = el.parentElement;
  let nthPart = '';
  if (p) {
    const siblings = Array.from(p.children) as Element[];
    const conflicts = siblings.filter(s => s !== el && s.tagName.toLowerCase() === tag &&
      compareClassSets(stableClasses, Array.from(s.classList).filter(c=>!HASH_CLASS_REGEX.test(c))));
    if (conflicts.length > 0) {
      const kids = Array.from(p.children);
      const idx = kids.indexOf(el);
      nthPart = idx >= 0 ? `:nth-child(${idx+1})` : '';
    }
  }

  return `${tag}${classPart}${nthPart}`;
}

function compareClassSets(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const as = new Set(a); for (const c of b) if (!as.has(c)) return false; return true;
}

function ensurePointsToTarget(selector: string, target: Element): string {
  const els = safeQueryAll(selector);
  if (els.length === 1 && els[0] === target) return selector;

  // If multiple or zero, progressively add nth-child bottom-up to ambiguous segments
  const parts = selector.split(' > ');
  for (let i = parts.length - 1; i >= 0; i--) {
    if (parts[i].startsWith('#') || /:nth-child\(\d+\)/.test(parts[i])) continue;
    const parentSel = parts.slice(0, i).join(' > ');
    const parentEl = parentSel ? (document.querySelector(parentSel) as Element | null) : target.parentElement;
    if (!parentEl) continue;
    const tagMatch = parts[i].match(/^([a-z0-9\-]+)/i);
    if (!tagMatch) continue;
    const tag = tagMatch[1].toLowerCase();
    const kids = Array.from(parentEl.children);
    const index = kids.findIndex(k => k.tagName.toLowerCase() === tag && elementMatchesClasses(k as Element, parts[i]));
    if (index >= 0) {
      parts[i] = `${parts[i]}:nth-child(${index+1})`;
      const cand = parts.join(' > ');
      const nodes = safeQueryAll(cand);
      if (nodes.length === 1 && nodes[0] === target) return cand;
    }
  }
  return selector;
}

function elementMatchesClasses(el: Element, seg: string): boolean {
  const cls = (seg.match(/\.([^:>]+)/g) || []).map(s => s.slice(1));
  if (cls.length === 0) return true;
  const stable = Array.from(el.classList).filter(c=>!HASH_CLASS_REGEX.test(c));
  const set = new Set(stable);
  return cls.every(c => set.has(c));
}

function safeQueryAll(sel: string): Element[] { try { return Array.from(document.querySelectorAll(sel)); } catch { return []; } }

export function validateSelector(selector: string): boolean { try { document.querySelector(selector); return true; } catch { return false; } }
export function queryCount(selector: string): number { try { return document.querySelectorAll(selector).length; } catch { return 0; } }

function isUnique(sel: string): boolean { try { return document.querySelectorAll(sel).length === 1; } catch { return false; } }
function cssEscape(v: string): string { return v.replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/'/g,"\\'"); }

function pack(selector: string, strategy: SelectorStrategy, confidence: number, el: Element): GeneratedSelector {
  const n = queryCount(selector); return { selector, strategy, confidence, uniqueness: n===1?1:1/Math.max(n,2), stability: strategy==='position'?0.9:0.85, element: el };
}

function dedupe(items: GeneratedSelector[]): GeneratedSelector[] { const seen = new Set<string>(); const out: GeneratedSelector[] = []; for (const it of items) if (!seen.has(it.selector)) { seen.add(it.selector); out.push(it); } return out; }

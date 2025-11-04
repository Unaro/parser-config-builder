/**
 * DevTools-accurate selector generator: full absolute path with correct :nth-child
 */

import type { GeneratedSelector, SelectorStrategy } from '@/types';

const HASH_CLASS_REGEX = /^(?:[a-z]{1,3}[-_])?[a-z0-9]{6,}$/i;
const STABLE_ATTRS = ['data-testid','data-test','data-qa','data-id','data-key','aria-label','role','itemprop'];

export function generateSelectors(element: Element): GeneratedSelector[] {
  const full = generateDevToolsAbsolute(element);
  const out: GeneratedSelector[] = [];
  if (full) out.push(pack(full.selector, 'position', full.confidence, element));

  // Also provide id/attr shortcuts if they are unique
  const id = element.id?.trim();
  if (id && isUnique(`#${cssEscape(id)}`)) out.push(pack(`#${cssEscape(id)}`, 'id', 1, element));
  for (const a of STABLE_ATTRS) {
    const v = element.getAttribute(a);
    if (v && isUnique(`[${a}="${cssEscape(v)}"]`)) out.push(pack(`[${a}="${cssEscape(v)}"]`, 'data-attribute', 0.95, element));
  }

  return dedupe(out).sort((a,b)=> (b.confidence - a.confidence) || (a.selector.length - b.selector.length));
}

/**
 * Always build full path from the closest id-anchored ancestor (inclusive) or from html, without skipping levels.
 * Segment format: tag(.stableClass1.stableClass2)?:nth-child(N)
 */
function generateDevToolsAbsolute(target: Element): { selector: string; confidence: number } | null {
  const segments: string[] = [];
  let node: Element | null = target;

  // find anchor (nearest ancestor with unique id), else will end at html
  let anchorFound = false;

  while (node) {
    const seg = buildSegmentExact(node);
    if (!seg) return null;
    segments.unshift(seg);

    if (node.id && isUnique(`#${cssEscape(node.id)}`)) {
      anchorFound = true;
      break; // include id segment and stop climbing
    }

    if (!node.parentElement) break;
    if (node.parentElement.tagName.toLowerCase() === 'html') {
      // include parent html as root
      segments.unshift('html');
      break;
    }

    node = node.parentElement;
  }

  let selector = segments.join(' > ');
  // Ensure uniqueness by refining :nth-child bottom-up if needed
  selector = refineToUnique(selector, target);

  const count = queryCount(selector);
  return { selector, confidence: count === 1 ? 0.95 : 0.8 };
}

/**
 * Build exact segment like DevTools: tag + up to 2 stable classes + :nth-child among ALL children
 */
function buildSegmentExact(el: Element): string {
  if (el.id && isUnique(`#${cssEscape(el.id)}`)) {
    return `#${cssEscape(el.id)}`; // devtools uses id alone as a segment
  }
  const tag = el.tagName.toLowerCase();
  const classes = Array.from(el.classList).filter(c=>!HASH_CLASS_REGEX.test(c)).slice(0,2);
  const classPart = classes.length ? `.${classes.map(cssEscape).join('.')}` : '';
  const nth = nthChildAll(el);
  const nthPart = nth > 1 ? `:nth-child(${nth})` : '';
  return `${tag}${classPart}${nthPart}`;
}

/** count position among ALL element children (not same-tag siblings) */
function nthChildAll(el: Element): number {
  const parent = el.parentElement; if (!parent) return 1;
  const children = Array.from(parent.children);
  const idx = children.indexOf(el);
  return idx >= 0 ? idx + 1 : 1;
}

function refineToUnique(base: string, target: Element): string {
  if (queryCount(base) === 1) return base;
  // try adding :nth-child to segments missing it, bottom-up
  const segs = base.split(' > ');
  // skip id-only segment (starts with #)
  for (let i = segs.length - 1; i >= 0; i--) {
    if (segs[i].startsWith('#')) continue;
    if (!/\:nth-child\(\d+\)/.test(segs[i])) {
      // add :nth-child(1) temporarily, then recompute correct index by querying parent
      segs[i] = segs[i] + ':nth-child(1)';
      const candidate = segs.join(' > ');
      // If still not unique, keep and continue; later user can refine further in UI.
      if (queryCount(candidate) >= 1) {
        // try to fix the index by mapping to actual DOM element path
        const fixed = fixNthIndices(candidate, target);
        if (queryCount(fixed) === 1) return fixed;
        // if not unique, keep fixed and continue loop to add more nth on higher segments
        segs.splice(0, segs.length, ...fixed.split(' > '));
      }
    }
  }
  return segs.join(' > ');
}

/** replace any :nth-child(1) placeholders with actual index along the path to target */
function fixNthIndices(selectorWithPlaceholders: string, target: Element): string {
  const parts = selectorWithPlaceholders.split(' > ');
  // Walk from root to target to compute nth-child based on real DOM structure
  let node: Element | null = document.documentElement; // html
  const fixed: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    let seg = parts[i];
    if (seg === 'html') { fixed.push('html'); node = document.documentElement; continue; }
    // Build a live selector for this level using already fixed prefix + this seg
    fixed.push(seg);
    const prefix = fixed.join(' > ');
    // If this segment has placeholder :nth-child(1), recompute real index
    if (/\:nth-child\(1\)/.test(seg)) {
      const parentSel = fixed.slice(0, -1).join(' > ');
      const parentEl = parentSel ? (document.querySelector(parentSel) as Element | null) : null;
      if (parentEl && node) {
        // find which child matches seg without nth-child
        const bareSeg = seg.replace(/\:nth-child\(1\)/, '');
        const candidates = parentEl.querySelectorAll(`:scope > ${bareSeg}`);
        // If target is deeper, approximate by index among siblings of parent
        if (candidates.length) {
          let index = 1;
          for (let k = 0; k < candidates.length; k++) {
            if (candidates[k] === (i === parts.length - 1 ? target : candidates[k])) { index = k + 1; break; }
          }
          const corrected = `${bareSeg}:nth-child(${index})`;
          fixed[fixed.length - 1] = corrected;
        }
      }
    }
    node = (document.querySelector(prefix) as Element | null) || node;
  }
  return fixed.join(' > ');
}

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

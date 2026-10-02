/**
 * Vite plugin to make Tailwind CSS v4 output compatible with older Chromium browsers.
 * 
 * Tailwind v4 generates modern CSS features that break on Chrome < 111:
 * - oklch() color values (Chrome 111+)
 * - color-mix() function (Chrome 111+)
 * - @layer CSS cascade layers (Chrome 99+)
 * - @property custom property definitions (Chrome 85+)
 * 
 * This plugin post-processes the CSS output to:
 * 1. Convert oklch() values to rgb() equivalents
 * 2. Remove @supports (color-mix) blocks (keep rgba fallbacks)
 * 3. Unwrap @layer blocks (keep content, remove layer wrapper)
 * 4. Remove @property blocks (custom props work without them)
 * 5. Strip color space interpolation hints (in oklab, in oklch, etc.) from gradients
 */

// ---- OKLCH to sRGB conversion ----

function oklchToRgb(L, C, H) {
  // Convert percentages: L is 0-1, C is 0-0.4ish, H is 0-360
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  // OKLAB to LMS (cube roots)
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  // LMS to linear sRGB
  let r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  let bVal = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  // Linear sRGB to sRGB (gamma correction)
  const toSrgb = (c) =>
    c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(Math.max(0, c), 1 / 2.4) - 0.055;

  r = Math.round(Math.max(0, Math.min(1, toSrgb(r))) * 255);
  g = Math.round(Math.max(0, Math.min(1, toSrgb(g))) * 255);
  bVal = Math.round(Math.max(0, Math.min(1, toSrgb(bVal))) * 255);

  return `rgb(${r}, ${g}, ${bVal})`;
}

function convertOklchValues(css) {
  // Match oklch(L C H) or oklch(L C H / alpha)
  // L can be percentage or decimal, C is decimal, H is number with optional deg
  css = css.replace(
    /oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)(?:deg)?\s*(?:\/\s*([\d.]+%?))?\s*\)/g,
    (match, rawL, rawC, rawH, rawAlpha) => {
      const L = parseFloat(rawL) > 1 ? parseFloat(rawL) / 100 : parseFloat(rawL);
      const C = parseFloat(rawC);
      const H = parseFloat(rawH);

      const rgbStr = oklchToRgb(L, C, H);

      if (rawAlpha !== undefined) {
        const alpha = rawAlpha.endsWith('%')
          ? parseFloat(rawAlpha) / 100
          : parseFloat(rawAlpha);
        const [r, g, b] = rgbStr.match(/\d+/g).map(Number);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }

      return rgbStr;
    }
  );

  // Match oklab(L a b) or oklab(L a b / alpha)
  // L can be percentage or decimal, a and b are signed decimals
  css = css.replace(
    /oklab\(\s*([\d.]+)%?\s+([-\d.]+)\s+([-\d.]+)\s*(?:\/\s*([\d.]+%?|\.[\d]+))?\s*\)/g,
    (match, rawL, rawA, rawB, rawAlpha) => {
      const L = parseFloat(rawL) > 1 ? parseFloat(rawL) / 100 : parseFloat(rawL);
      const a = parseFloat(rawA);
      const b = parseFloat(rawB);

      // OKLAB to sRGB (same as oklchToRgb but with direct a,b instead of C,H)
      const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
      const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
      const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

      const l = l_ * l_ * l_;
      const m = m_ * m_ * m_;
      const s = s_ * s_ * s_;

      let r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
      let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
      let bVal = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

      const toSrgb = (c) =>
        c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(Math.max(0, c), 1 / 2.4) - 0.055;

      r = Math.round(Math.max(0, Math.min(1, toSrgb(r))) * 255);
      g = Math.round(Math.max(0, Math.min(1, toSrgb(g))) * 255);
      bVal = Math.round(Math.max(0, Math.min(1, toSrgb(bVal))) * 255);

      if (rawAlpha !== undefined) {
        const alpha = rawAlpha.endsWith('%')
          ? parseFloat(rawAlpha) / 100
          : parseFloat(rawAlpha);
        return `rgba(${r}, ${g}, ${bVal}, ${alpha})`;
      }
      return `rgb(${r}, ${g}, ${bVal})`;
    }
  );

  return css;
}

// ---- Remove @supports (color:color-mix(...)) blocks ----
// These contain color-mix() overrides; the rgba() fallbacks before them are sufficient.

function removeColorMixSupports(css) {
  let result = '';
  let i = 0;

  while (i < css.length) {
    // Look for @supports (color:color-mix(
    const supportsIdx = css.indexOf('@supports (color:color-mix(', i);
    if (supportsIdx === -1) {
      result += css.slice(i);
      break;
    }

    // Add everything before this @supports
    result += css.slice(i, supportsIdx);

    // Find the opening { of the @supports block
    let braceStart = css.indexOf('{', supportsIdx);
    if (braceStart === -1) {
      result += css.slice(supportsIdx);
      break;
    }

    // Count braces to find the matching close
    let depth = 1;
    let j = braceStart + 1;
    while (j < css.length && depth > 0) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}') depth--;
      j++;
    }

    // Skip the entire @supports block (j is now past the closing })
    i = j;
  }

  return result;
}

// ---- Unwrap @layer blocks ----
// Remove the @layer wrapper but keep the content inside

function unwrapLayers(css) {
  let result = '';
  let i = 0;

  while (i < css.length) {
    const layerIdx = css.indexOf('@layer ', i);
    if (layerIdx === -1) {
      result += css.slice(i);
      break;
    }

    // Add everything before @layer
    result += css.slice(i, layerIdx);

    // Find the opening {
    let braceStart = css.indexOf('{', layerIdx);
    if (braceStart === -1) {
      result += css.slice(layerIdx);
      break;
    }

    // Extract content inside the @layer block
    let depth = 1;
    let j = braceStart + 1;
    while (j < css.length && depth > 0) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}') depth--;
      j++;
    }

    // Content is between braceStart+1 and j-1 (exclude the final })
    const content = css.slice(braceStart + 1, j - 1);
    result += content;
    i = j;
  }

  return result;
}

// ---- Remove @property blocks ----
// Chrome < 85 doesn't support @property; Tailwind uses them for custom property
// type hints but CSS custom properties work without them.

function removeAtProperty(css) {
  let result = '';
  let i = 0;

  while (i < css.length) {
    const propIdx = css.indexOf('@property ', i);
    if (propIdx === -1) {
      result += css.slice(i);
      break;
    }

    result += css.slice(i, propIdx);

    // Find opening {
    let braceStart = css.indexOf('{', propIdx);
    if (braceStart === -1) {
      result += css.slice(propIdx);
      break;
    }

    // Find matching }
    let depth = 1;
    let j = braceStart + 1;
    while (j < css.length && depth > 0) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}') depth--;
      j++;
    }

    i = j;
  }

  return result;
}

// ---- Strip color space interpolation hints from gradients ----
// "to bottom right in oklab" → "to bottom right"
// "in oklab," → ","
// These are CSS Color Level 4 gradient interpolation hints (Chrome 111+)

function stripColorSpaceHints(css) {
  // Remove "in oklab", "in oklch", "in srgb", "in srgb-linear", "in lab", "in lch", "in display-p3"
  // from gradient positions and anywhere else they appear
  return css.replace(/\s+in\s+(oklab|oklch|srgb-linear|srgb|display-p3|lab|lch)\b/g, '');
}

// ---- Unwrap Tailwind's @supports feature-detection guards ----
// Tailwind v4 wraps custom property initialization in @supports conditions
// that may not evaluate correctly in Chrome < 114. Since we only have
// Tailwind v4 (no v3 conflict), we unconditionally apply the properties.

function unwrapTailwindSupports(css) {
  // Target Tailwind's specific @supports patterns (NOT our gap fallback)
  const patterns = [
    '@supports (((-webkit-hyphens:none))',     // Main TW4 custom property guard
    '@supports (not ((-webkit-appearance:-apple-pay-button)))', // TW4 placeholder guard
  ];

  for (const pattern of patterns) {
    let idx = css.indexOf(pattern);
    while (idx !== -1) {
      const braceStart = css.indexOf('{', idx);
      if (braceStart === -1) break;

      let depth = 1;
      let j = braceStart + 1;
      while (j < css.length && depth > 0) {
        if (css[j] === '{') depth++;
        else if (css[j] === '}') depth--;
        j++;
      }

      // Replace the @supports{...} wrapper with just the content
      const content = css.slice(braceStart + 1, j - 1);
      css = css.slice(0, idx) + content + css.slice(j);
      idx = css.indexOf(pattern, idx);
    }
  }

  return css;
}

// ---- Replace --tw-*:initial with guaranteed-invalid var reference ----
// Chrome < 114 may treat `--prop: initial` as setting the property to
// the literal keyword "initial" instead of the CSS guaranteed-invalid value.
// This breaks var(--prop, fallback) chains because the fallback is never used.
// Fix: use var(--_) which references an undefined property (no fallback),
// producing the guaranteed-invalid value through a well-supported code path.

function replaceInitialCustomProps(css) {
  return css.replace(/(--tw-[a-z-]+)\s*:\s*initial/g, '$1:var(--_)');
}

// ---- Add space between adjacent var() calls ----
// Lightning CSS minifies away spaces: var(--a)var(--b) → tokens may concatenate
// on older Chrome (e.g. #7428dc + 0% → "#7428dc0%" instead of "#7428dc 0%").
// Adding explicit spaces ensures correct parsing in all browsers.

function addVarSpacing(css) {
  return css.replace(/\)var\(--/g, ') var(--');
}

// ---- Main plugin ----

export default function legacyCssPlugin() {
  return {
    name: 'vite-plugin-legacy-css',
    enforce: 'post',
    apply: 'build',
    generateBundle(_options, bundle) {
      for (const [fileName, asset] of Object.entries(bundle)) {
        if (fileName.endsWith('.css') && typeof asset.source === 'string') {
          let css = asset.source;

          // Order matters:
          // 1. Remove color-mix @supports blocks first (keep rgba fallbacks)
          css = removeColorMixSupports(css);

          // 2. Convert any remaining oklch() to rgb()
          css = convertOklchValues(css);

          // 3. Strip color space interpolation hints from gradients
          css = stripColorSpaceHints(css);

          // 4. Unwrap Tailwind's @supports feature-detection guards
          css = unwrapTailwindSupports(css);

          // 5. Replace --tw-*:initial with var(--_) for guaranteed-invalid
          css = replaceInitialCustomProps(css);

          // 6. Add spaces between adjacent var() calls
          css = addVarSpacing(css);

          // 7. Unwrap @layer blocks
          css = unwrapLayers(css);

          // 8. Remove @property blocks
          css = removeAtProperty(css);

          asset.source = css;
        }
      }
    },
  };
}

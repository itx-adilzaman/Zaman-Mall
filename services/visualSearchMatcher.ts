import { Product } from '../types';
import { VisualAnalysisResult } from './gemini';

export interface ScoredProduct {
  product: Product;
  score: number;
  matchPercentage: number;
  matchedAttributes: string[];
}

/**
 * Synonym map — expands a keyword to related terms that might appear in product names.
 * This bridges the gap between AI-generated keywords and actual store product names.
 */
const SYNONYM_MAP: Record<string, string[]> = {
  // Watches
  watch: ['timepiece', 'wristwatch', 'chronograph', 'smartwatch', 'digital watch', 'analog watch'],
  wristwatch: ['watch', 'timepiece', 'chronograph'],
  timepiece: ['watch', 'wristwatch', 'clock'],
  chronograph: ['watch', 'wristwatch', 'stopwatch'],
  smartwatch: ['watch', 'smart band', 'fitness tracker', 'wearable'],
  // Shoes / Footwear
  shoes: ['sneakers', 'footwear', 'boots', 'trainers', 'loafers', 'sandals', 'slippers'],
  sneakers: ['shoes', 'trainers', 'running shoes', 'sport shoes', 'kicks'],
  boots: ['shoes', 'ankle boots', 'footwear'],
  sandals: ['slippers', 'footwear', 'flip flops'],
  // Bags
  bag: ['handbag', 'backpack', 'purse', 'tote', 'satchel', 'wallet', 'clutch'],
  handbag: ['bag', 'purse', 'tote', 'shoulder bag'],
  backpack: ['bag', 'rucksack', 'school bag', 'travel bag'],
  wallet: ['purse', 'cardholder', 'billfold'],
  // Electronics
  phone: ['mobile', 'smartphone', 'cell phone', 'handset'],
  mobile: ['phone', 'smartphone', 'cell'],
  smartphone: ['phone', 'mobile', 'android', 'iphone'],
  earbuds: ['earphones', 'headphones', 'wireless earphones', 'tws', 'airpods'],
  earphones: ['earbuds', 'headphones', 'in-ear'],
  headphones: ['earphones', 'earbuds', 'over-ear', 'headset'],
  laptop: ['notebook', 'computer', 'pc', 'ultrabook'],
  tablet: ['ipad', 'tab', 'slate'],
  // Clothing
  shirt: ['top', 't-shirt', 'tee', 'blouse', 'polo', 'kurta'],
  tshirt: ['shirt', 't-shirt', 'tee', 'top'],
  trouser: ['pants', 'jeans', 'trousers', 'bottoms'],
  jeans: ['denim', 'pants', 'trousers'],
  dress: ['frock', 'gown', 'outfit', 'apparel'],
  jacket: ['coat', 'hoodie', 'blazer', 'outerwear'],
  // Accessories
  sunglasses: ['glasses', 'shades', 'eyewear', 'specs'],
  glasses: ['sunglasses', 'eyewear', 'spectacles'],
  belt: ['strap', 'waistband'],
  cap: ['hat', 'beanie', 'headwear'],
  // Home
  perfume: ['fragrance', 'cologne', 'scent', 'attar', 'deodorant'],
  fragrance: ['perfume', 'cologne', 'scent', 'attar'],
  // Generic
  luxury: ['premium', 'branded', 'designer', 'high-end'],
  casual: ['everyday', 'comfortable', 'relaxed'],
  sport: ['athletic', 'gym', 'fitness', 'running', 'training'],
  men: ['gents', 'male', 'mens'],
  women: ['ladies', 'female', 'womens', 'girls'],
  kids: ['children', 'boys', 'girls', 'junior'],
  leather: ['genuine leather', 'pu leather', 'faux leather', 'cowhide'],
  digital: ['electronic', 'led', 'lcd'],
  analog: ['classic', 'mechanical', 'traditional'],
  silver: ['chrome', 'stainless', 'metallic'],
  gold: ['golden', 'brass', 'yellow gold'],
  black: ['dark', 'onyx', 'matte black'],
  white: ['ivory', 'cream', 'pearl'],
};

/**
 * Given a word, returns it plus all its synonyms.
 */
function expandWithSynonyms(word: string): string[] {
  const w = word.toLowerCase().trim();
  const syns = SYNONYM_MAP[w] || [];
  return [w, ...syns];
}

/**
 * Stem a word to its base — simple suffix stripping for English.
 * e.g. "watches" → "watch", "running" → "run"
 */
function stem(word: string): string {
  const w = word.toLowerCase().trim();
  if (w.endsWith('ches')) return w.slice(0, -2); // watches → watch
  if (w.endsWith('ies')) return w.slice(0, -3) + 'y'; // batteries → battery
  if (w.endsWith('ves')) return w.slice(0, -3) + 'f'; // knives → knife
  if (w.endsWith('es') && w.length > 5) return w.slice(0, -2);
  if (w.endsWith('ing') && w.length > 6) return w.slice(0, -3);
  if (w.endsWith('ed') && w.length > 5) return w.slice(0, -2);
  if (w.endsWith('s') && w.length > 4) return w.slice(0, -1);
  return w;
}

/**
 * Checks if a product text contains a word, its stem, or any of its synonyms.
 */
function fuzzyContains(text: string, word: string): { matched: boolean; term: string } {
  const expanded = expandWithSynonyms(word);
  const stemmed = stem(word);

  for (const term of expanded) {
    if (text.includes(term)) return { matched: true, term };
  }
  if (stemmed !== word && text.includes(stemmed)) return { matched: true, term: stemmed };

  // Also check if any word in the text is a synonym of this word
  const textWords = text.split(/\s+/);
  for (const tw of textWords) {
    const twSyns = SYNONYM_MAP[tw] || [];
    if (twSyns.includes(word) || twSyns.includes(stemmed)) {
      return { matched: true, term: tw };
    }
  }
  return { matched: false, term: word };
}

/**
 * Intelligent weighted matcher that scores catalog products against Visual AI analysis.
 */
export const matchProductsWithVisualAnalysis = (
  products: Product[],
  analysis: VisualAnalysisResult
): ScoredProduct[] => {
  if (!products || products.length === 0) return [];

  // Build full search word pool from all analysis fields
  const rawWords = [
    ...(analysis.searchQuery ? analysis.searchQuery.toLowerCase().split(/\s+/) : []),
    ...(analysis.keywords || []).map(k => k.toLowerCase()),
    ...(analysis.detectedItem ? analysis.detectedItem.toLowerCase().split(/\s+/) : []),
  ].filter(w => w.length > 1);

  const uniqueWords = Array.from(new Set(rawWords));
  const targetCategory = (analysis.category || '').toLowerCase().trim();
  const targetColors = (analysis.colors || []).map(c => c.toLowerCase().trim());
  const categoryWords = targetCategory.split(/\s+/).filter(w => w.length > 2);

  const scoredList: ScoredProduct[] = [];

  for (const product of products) {
    let score = 0;
    const matchedAttributes: string[] = [];
    const prodName = (product.name || '').toLowerCase();
    const prodDesc = (product.description || '').toLowerCase();
    const prodCat = (product.category || '').toLowerCase();

    // ── 1. CATEGORY MATCHING ──────────────────────────────────────────
    if (targetCategory && targetCategory !== 'all') {
      if (prodCat === targetCategory) {
        score += 20;
        matchedAttributes.push(`Category: ${product.category}`);
      } else if (prodCat.includes(targetCategory) || targetCategory.includes(prodCat)) {
        score += 15;
        matchedAttributes.push(`Category: ${product.category}`);
      } else {
        // partial word match
        for (const cWord of categoryWords) {
          const { matched } = fuzzyContains(prodCat, cWord);
          if (matched) {
            score += 8;
            matchedAttributes.push(`Category~${cWord}`);
            break;
          }
        }
      }
    }

    // ── 2. KEYWORD + SYNONYM MATCHING IN PRODUCT NAME ─────────────────
    // High weight because name is the most reliable signal
    for (const word of uniqueWords) {
      const { matched, term } = fuzzyContains(prodName, word);
      if (matched) {
        score += 14;
        matchedAttributes.push(term);
      }
    }

    // Direct detected item FULL phrase in name (+25 pts bonus)
    if (analysis.detectedItem && prodName.includes(analysis.detectedItem.toLowerCase())) {
      score += 25;
    }
    // Each word of detectedItem individually (+8 pts, with synonym expansion)
    if (analysis.detectedItem) {
      for (const w of analysis.detectedItem.toLowerCase().split(/\s+/)) {
        if (w.length > 2 && !uniqueWords.includes(w)) {
          const { matched, term } = fuzzyContains(prodName, w);
          if (matched) {
            score += 8;
            matchedAttributes.push(term);
          }
        }
      }
    }

    // ── 3. KEYWORD + SYNONYM MATCHING IN DESCRIPTION ─────────────────
    for (const word of uniqueWords) {
      const { matched } = fuzzyContains(prodDesc, word);
      if (matched) score += 4;
    }

    // ── 4. COLOR MATCHING ─────────────────────────────────────────────
    for (const col of targetColors) {
      if (col.length < 2) continue;
      const { matched: inName } = fuzzyContains(prodName, col);
      const { matched: inDesc } = fuzzyContains(prodDesc, col);
      if (inName || inDesc) {
        score += 6;
        matchedAttributes.push(col);
      }
      if (product.variants) {
        const hasColorVariant = product.variants.some(v =>
          v.type.toLowerCase().includes('color') &&
          v.options.some(opt => {
            const optVal = (typeof opt === 'string' ? opt : opt.value).toLowerCase();
            return optVal.includes(col);
          })
        );
        if (hasColorVariant) {
          score += 8;
          matchedAttributes.push(`Color: ${col}`);
        }
      }
    }

    // ── 5. CROSS-SYNONYM BOOST ────────────────────────────────────────
    // If any word in the product name is a synonym of any keyword, boost it
    const prodNameWords = prodName.split(/\s+/);
    for (const pw of prodNameWords) {
      if (pw.length < 3) continue;
      const pwSyns = SYNONYM_MAP[pw] || [];
      for (const kw of uniqueWords) {
        if (pwSyns.includes(kw)) {
          score += 10;
          matchedAttributes.push(`~${pw}`);
          break;
        }
      }
    }

    // In-stock bonus
    if (score > 0 && (product.stock || 0) > 0) score += 2;

    if (score > 0) {
      const basePercentage = Math.min(98, Math.max(60, Math.round(50 + score * 1.3)));
      scoredList.push({
        product,
        score,
        matchPercentage: basePercentage,
        matchedAttributes: Array.from(new Set(matchedAttributes)).slice(0, 4),
      });
    }
  }

  // Sort descending by score, return top 10
  scoredList.sort((a, b) => b.score - a.score);
  return scoredList.slice(0, 10);
};


/**
 * Client-side fallback analyzer using HTML5 Canvas to extract basic color tones and properties
 * if network fails or Gemini API is not reachable.
 */
export const extractClientSideFeatures = async (
  fileOrBlob: Blob
): Promise<VisualAnalysisResult> => {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(fileOrBlob);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            detectedItem: 'Shopping Item',
            category: 'All',
            keywords: ['trending', 'popular'],
            colors: ['mixed'],
            searchQuery: '',
            confidence: 'low'
          });
          return;
        }

        ctx.drawImage(img, 0, 0, 64, 64);
        const data = ctx.getImageData(0, 0, 64, 64).data;

        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 16) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }

        const avgR = Math.round(r / count);
        const avgG = Math.round(g / count);
        const avgB = Math.round(b / count);

        let detectedColor = 'dark';
        if (avgR > 200 && avgG > 200 && avgB > 200) detectedColor = 'white';
        else if (avgR < 50 && avgG < 50 && avgB < 50) detectedColor = 'black';
        else if (avgR > avgG + 30 && avgR > avgB + 30) detectedColor = 'red';
        else if (avgB > avgR + 30 && avgB > avgG + 30) detectedColor = 'blue';
        else if (avgG > avgR + 30 && avgG > avgB + 30) detectedColor = 'green';
        else if (avgR > 150 && avgG > 150 && avgB < 100) detectedColor = 'yellow';

        resolve({
          detectedItem: 'Product Scan',
          category: 'All',
          keywords: [detectedColor, 'popular', 'lifestyle'],
          colors: [detectedColor],
          searchQuery: detectedColor,
          confidence: 'medium'
        });
      } catch {
        resolve({
          detectedItem: 'Captured Item',
          category: 'All',
          keywords: ['accessories', 'trending'],
          colors: [],
          searchQuery: '',
          confidence: 'low'
        });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        detectedItem: 'Captured Item',
        category: 'All',
        keywords: ['lifestyle'],
        colors: [],
        searchQuery: '',
        confidence: 'low'
      });
    };

    img.src = objectUrl;
  });
};

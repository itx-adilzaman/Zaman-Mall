import { ProductVariant, VariantOption } from '@/types';

/**
 * Normalize a raw option (string | VariantOption) → VariantOption
 */
export function normalizeOption(opt: string | VariantOption): VariantOption {
  return typeof opt === 'string' ? { value: opt } : opt;
}

/**
 * Get display value of an option
 */
export function optionValue(opt: string | VariantOption): string {
  return typeof opt === 'string' ? opt : opt.value;
}

/**
 * Get the custom price of an option (undefined if none)
 */
export function optionPrice(opt: string | VariantOption): number | undefined {
  return typeof opt === 'string' ? undefined : opt.price;
}

/**
 * Given selected variants (type→value map) and variant definitions,
 * return the highest custom price found among selected options,
 * or undefined if none have a custom price.
 *
 * Rule: if ANY selected option has a custom price, that price wins.
 * If multiple selections have custom prices, we take the one from
 * the first variant type that has a custom price set.
 */
export function resolveVariantPrice(
  selectedVariants: Record<string, string>,
  variants: ProductVariant[],
  basePrice: number
): number {
  for (const variant of variants) {
    const selectedValue = selectedVariants[variant.type];
    if (!selectedValue) continue;

    const matchedOpt = variant.options.find(
      opt => optionValue(opt) === selectedValue
    );
    if (!matchedOpt) continue;

    const customPrice = optionPrice(matchedOpt);
    if (customPrice !== undefined && customPrice > 0) {
      return customPrice;
    }
  }
  return basePrice;
}

/**
 * Format variant options for display in admin:
 * "Red (+Rs.200), Blue, Green (+Rs.150)"
 */
export function formatVariantOptions(
  options: (string | VariantOption)[],
  basePrice?: number
): string {
  return options
    .map(opt => {
      const val = optionValue(opt);
      const price = optionPrice(opt);
      if (price !== undefined && price > 0) {
        return `${val} (Rs. ${price.toLocaleString()})`;
      }
      return val;
    })
    .join(', ');
}

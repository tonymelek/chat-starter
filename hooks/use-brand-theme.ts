import { BrandTokens, type SemanticColors } from '@/constants/brand';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useBrandTheme(): SemanticColors {
  const scheme = useColorScheme() ?? 'light';
  return BrandTokens[scheme];
}

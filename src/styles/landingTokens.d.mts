export declare const LP_COLORS: {
  ink: string; text: string; body: string; muted: string; track: string; lime: string;
  indigo: string; indigo2: string; indigoSoft: string; indigoTag: string;
  chartLime: string; chartMint: string; chartIndigo: string; chartAmber: string; chartPink: string; tooltip: string;
};
export type LpColor = keyof typeof LP_COLORS;
export declare const LP_CHART_ORDER: string[];
export declare function lpAlpha(name: LpColor, a: number): string;
export declare const LP_FONTS: { head: string[]; text: string[] };
export declare const LP_BACKGROUNDS: Record<string, string>;
export declare const LP_SHADOWS: Record<string, string>;
export declare const lpTailwindTheme: Record<string, unknown>;

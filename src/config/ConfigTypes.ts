export type TierType = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type DeathTierType = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface TierTitles {
  base: string;
  subtier: string;
}

export interface MultiHitChances {
  twoHits: number;
  threeHits: number;
  fiveHits: number;
}

export interface DeathTierInfo {
  resurrection: number;
  deathAura: number;
  honorReduction: number;
}

export interface ChatFilter {
  maxMessages: number;
  maxCharacters: number;
  timeFrame: number;
  timeout: number;
}

export interface KillCount {
  player: number, 
  attackAnimal: number,
  defenseAnimal: number, 
  weakAnimal: number,
  bossAnimal: number,
  eat: number

}
export interface TierGrade {
  base: string;
  // Can have multiple bases for more movement
  subTier: string[];
  // For gradient generator, replace red(FF0000) with gradient (redStart -> redMid -> redStart)
  redStart: string;
  redMid: string;
  redCount: number;
  // For gradient generator, replace green(00FF00) "
  greenStart: string;
  greenMid: string;
  greenCount: number;
  // For gradient generator, replace blue(0000FF) "
  blueStart: string;
  blueMid: string;
  blueCount: number;
}

export interface TierSize {
  base: number,
  subTier: number,
  applyRotation: boolean
}

function createTierSize({base = 0.2, subTier = 0.2, applyRotation = false} : Partial<TierSize> = {}) : TierSize
{
  return {base, subTier, applyRotation};
}

// These are the only values modifiable from outside
export interface PersistedConfig {
  honorScore: number;
  aidScore: number;
  deathScore: number;
  killCounts: KillCount;
  travelDistance: number;
  chatFilter: ChatFilter;
}

// Full internal state
export interface GameConfig extends PersistedConfig {
  currentTier: TierType;
  currentDeathTier: DeathTierType;
  tierName: string;
  isSubtierUnlocked: boolean;
  multiHit: MultiHitChances;
  deathTierInfo: DeathTierInfo;
  cooldownMs: number;
  grade: TierGrade;
  size: number;
}

export const HONOR_THRESHOLDS: Record<TierType, number> = {
  0: 0, 1: 10, 2: 50, 3: 150, 4: 400, 5: 1000, 6: 2500
};

export const AID_THRESHOLDS: Record<TierType, number> = {
  0: 0, 1: 20, 2: 50, 3: 100, 4: 200, 5: 500, 6: 1000
};

export const DEATH_THRESHOLDS: Record<DeathTierType, number> = {
  0: 0, 1: 10, 2: 20, 3: 40, 4: 60, 5: 100, 6: 200
};

export const DEATH_TABLE: Record<DeathTierType, DeathTierInfo> = {
  0: {resurrection: 0, deathAura: 0, honorReduction: 0.25 },
  1: {resurrection: 10, deathAura: 0, honorReduction: 0.50 },
  2: {resurrection: 20, deathAura: 0, honorReduction: 1.0 },
  3: {resurrection: 35, deathAura: 0, honorReduction: 2.0 },
  4: {resurrection: 50, deathAura: 0, honorReduction: 5.0 },
  5: {resurrection: 65, deathAura: 0, honorReduction: 7.5 },
  6: {resurrection: 80, deathAura: 0, honorReduction: 10.0 }
};

export const TIER_NAMES: Record<TierType, TierTitles> = {
  0: { base: "[b][fff76b]★ ", subtier: "[b][fff76b]★ " },
  1: { base: "[b][5c5c5c]ʂtαɾdυʂt ⁎ ", subtier: "[b][5c5c5c]ʂ[92906f]t[c9c581]α[fff994]ɾ[c9c581]d[92906f]υ[5c5c5c]ʂ[4e4e4e]t [333333]⁎ " },
  2: { base: "[b][450d59]ɳσʋα * ", subtier: "[b][450d59]ɳ[6f1c8b]σ[982abc]ʋ[63187d]α[2e063d] [2e063d]* " },
  3: { base: "[b][1a0a52]ρυʅʂαɾ ⁑ ", subtier: "[b][1a0a52]ρ[25106b]υ[301684]ʅ[321789]ʂ[241068]α[160846]ɾ[11053b] [11053b]⁑ " },
  4: { base: "[b][11053b]ɳҽbυʅα ⁂ ", subtier: "[b][11053b]ɳ[160848]ҽ[1e0c5b]b[2f1581]υ[4a1c97]ʅ[70209d]α [982abc]⁂ " },
  5: { base: "[b][00374a]ʂυρҽɾ-ɳσʋα ☆ ", subtier: "[b][00374a]ʂ[003b6d]υ[003f8f]ρ[004eb1]ҽ[007ecf]ɾ[01afed]-[0fa9ef]ɳ[2a6dd4]σ[4631b9]ʋ[3837a8]α [016e8f]☆ " },
  6: { base: "[b][fff76b]ƈҽʅҽʂtιαʅ ★ ", subtier: "[b][fff76b]ƈ[fff98d]ҽ[fefaaf]ʅ[fefcd2]ҽ[fefde4]ʂ[fffeee]t[fffef8]ι[fffef4]α[fffdd4]ʅ [fff994]★ " }
};

export const TIER_SIZE_TABLE: Record<TierType, TierSize> = {
  0: createTierSize({base: 0.2, subTier: 0.2}),
  1: createTierSize({base: 0.4, subTier: 0.6}),
  2: createTierSize({base: 0.8, subTier: 1.0}),
  3: createTierSize({base: 1.2, subTier: 1.4}),
  4: createTierSize({base: 1.6, subTier: 1.8}),
  5: createTierSize({base: 2.0, subTier: 2.2}),
  6: createTierSize({base: 2.3, subTier: 2.3, applyRotation: true}),
}

export const MULTI_HIT_TABLE: Record<TierType, MultiHitChances> = {
  0: { twoHits: 0,  threeHits: 0,  fiveHits: 0 },
  1: { twoHits: 10,  threeHits: 0,  fiveHits: 0 },
  2: { twoHits: 20, threeHits: 10,  fiveHits: 0 },
  3: { twoHits: 40, threeHits: 20,  fiveHits: 5 },
  4: { twoHits: 60, threeHits: 30,  fiveHits: 10 },
  5: { twoHits: 80, threeHits: 50, fiveHits: 15 },
  6: { twoHits: 100, threeHits: 70, fiveHits: 30 }
};


export const BASE_COOLDOWN = 10000;
export const POINT_COOLDOWN_REDUCTION: Record<TierType, number> = {
  0: 10000 /* 10s */, 1: 9500 /* 9.5s */, 2: 8500 /* 8.5s */, 3: 7000 /* 7s */, 4: 5000 /* 5s */, 5: 4000 /* 4s */, 6: 2000 /* 2s */
};


export const TIER_GRADES: Record<TierType, TierGrade> = {
  0: {
    base: "",
    subTier: [""],
    redStart: "",
    redMid: "",
    redCount: 0,
    greenStart: "",
    greenMid: "",
    greenCount: 0,
    blueStart: "",
    blueMid: "",
    blueCount: 0
  },
  1: {
    base: "",
    subTier: [""],
    redStart: "",
    redMid: "",
    redCount: 0,
    greenStart: "",
    greenMid: "",
    greenCount: 0,
    blueStart: "",
    blueMid: "",
    blueCount: 0
  },
  2: {
    base: "",
    subTier: [""],
    redStart: "",
    redMid: "",
    redCount: 0,
    greenStart: "",
    greenMid: "",
    greenCount: 0,
    blueStart: "",
    blueMid: "",
    blueCount: 0
  },
  3: {
    base: "",
    subTier: [""],
    redStart: "",
    redMid: "",
    redCount: 0,
    greenStart: "",
    greenMid: "",
    greenCount: 0,
    blueStart: "",
    blueMid: "",
    blueCount: 0
  },
  4: {
    base: "",
    subTier: [""],
    redStart: "",
    redMid: "",
    redCount: 0,
    greenStart: "",
    greenMid: "",
    greenCount: 0,
    blueStart: "",
    blueMid: "",
    blueCount: 0
  },
  5: {
    base: "",
    subTier: [""],
    redStart: "",
    redMid: "",
    redCount: 0,
    greenStart: "",
    greenMid: "",
    greenCount: 0,
    blueStart: "",
    blueMid: "",
    blueCount: 0
  },
  6: {
    base: "",
    subTier: [""],
    redStart: "",
    redMid: "",
    redCount: 0,
    greenStart: "",
    greenMid: "",
    greenCount: 0,
    blueStart: "",
    blueMid: "",
    blueCount: 0
  }
}
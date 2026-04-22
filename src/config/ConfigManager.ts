import Java from 'frida-java-bridge';
import { ConfigHelper } from './ConfigHelpers';
import { 
  GameConfig, PersistedConfig, TierType, DeathTierType, TIER_NAMES,
  HONOR_THRESHOLDS, AID_THRESHOLDS, DEATH_THRESHOLDS,
  MULTI_HIT_TABLE, POINT_COOLDOWN_REDUCTION,
  TIER_GRADES,
  ChatFilter,
  TIER_SIZE_TABLE,
  DEATH_TABLE
  
} from './ConfigTypes';

function isChatFilter(obj: any): obj is ChatFilter {
    return obj &&
        typeof obj.maxMessages === 'number' &&
        typeof obj.maxCharacters === 'number' &&
        typeof obj.timeFrame === 'number' &&
        typeof obj.timeout === 'number';
}


class ConfigManager {
    private configPath: string = "";

    private config: GameConfig = {
        honorScore: 0, aidScore: 0, deathScore: 0, travelDistance: 0,
        enforeAttack: false, enforceHp: false, chatFilter: {maxMessages: 2, maxCharacters: 150, timeFrame: 3000 /* 3s */, timeout: 5000 /* 5s */},
        currentTier: 0, currentDeathTier: 0, tierName: TIER_NAMES[0].base, isSubtierUnlocked: false,
        deathTierInfo: DEATH_TABLE[0], cooldownMs: POINT_COOLDOWN_REDUCTION[0], grade: TIER_GRADES[0], size: TIER_SIZE_TABLE[0].base,
        multiHit: MULTI_HIT_TABLE[0]
    };

    private signals: { [K in keyof GameConfig]?: Array<(val: GameConfig[K]) => void> } = {};

    public async init() {
        const rawData = await this.loadAndDecrypt();
        if (rawData) {
            this.config.honorScore = rawData.honorScore;
            this.config.aidScore = rawData.aidScore;
            this.config.deathScore = rawData.deathScore;
            this.config.enforeAttack = rawData.enforeAttack;
            this.config.enforceHp = rawData.enforceHp;
            this.config.travelDistance = rawData.travelDistance;
            this.config.chatFilter = rawData.chatFilter;

            this.calculateTier(false);
            this.calculateAntiDamage(false);
        }
    }

    public incrementScore<K extends keyof PersistedConfig>(key: K, amount: number = 1): number {
        const newValue = (this.config[key] as number) + amount;
        this.setScore(key, newValue);
        return this.config[key] as number; // Returns the (potentially clamped) value
    }
    
    public decrementScore<K extends keyof PersistedConfig>(key: K, amount: number = 1): number {
        const current = this.config[key] as number;
        const newValue = Math.max(0, current - amount);
        this.setScore(key, newValue);
        return this.config[key] as number; // Returns the clamped value
    }

    public setScore<K extends keyof PersistedConfig>(key: K, value: number | boolean | ChatFilter) {
        if (key === 'honorScore' && typeof value === 'number') {
            this.config.honorScore = value;
            this.calculateTier(true);
            this.emit('honorScore', this.config.honorScore);
        } 
        else if (key === 'aidScore' && typeof value === 'number') {
            const cap = AID_THRESHOLDS[this.config.currentTier];
            const clamped = Math.min(value, cap);
            if (this.config.aidScore !== clamped) {
                this.config.aidScore = clamped;
                this.calculateSubtier(true);
                this.emit('aidScore', clamped);
            }
        } 
        else if (key === 'travelDistance' && typeof value === 'number') {
            this.config.travelDistance = value;
            this.emit('travelDistance', value);
        }
        else if (key === 'deathScore' && typeof value === 'number') {
            this.config.deathScore = value;
            this.calculateAntiDamage(true);
            this.emit('deathScore', value)
        }
        else if (key === 'enforceHp' && typeof value === 'boolean') {
            this.config.enforceHp = value;
        }
        else if (key === 'enforeAttack' && typeof value === 'boolean') {
            this.config.enforceHp = value;
        }
        else if (key === 'chatFilter' && isChatFilter(value)) {
            this.config.chatFilter = value;
        }

        this.persist();
    }

    // Emits value changes if nothing passed in function
    private calculateTier(shouldEmit: boolean = true) {
        let newTier: TierType = 0;
        for (let i = 6; i >= 0; i--) {
        if (this.config.honorScore >= HONOR_THRESHOLDS[i as TierType]) {
            newTier = i as TierType;
            break;
        }
        }

        if (this.config.currentTier !== newTier) {
        const isTierDown = newTier < this.config.currentTier;
        this.config.currentTier = newTier;
        this.config.tierName = TIER_NAMES[newTier].base;
        this.config.size = TIER_SIZE_TABLE[newTier].base;

        if (isTierDown) {
            const newCap = AID_THRESHOLDS[newTier];
            if (this.config.aidScore > newCap) {
            this.config.aidScore = newCap;
            if (shouldEmit) this.emit('aidScore', this.config.aidScore);
            }
        }

        this.config.multiHit = MULTI_HIT_TABLE[newTier];
        this.config.grade = TIER_GRADES[newTier];

        if (shouldEmit) {
            this.emit('currentTier', newTier);
            this.emit('multiHit', this.config.multiHit);
            this.emit('grade', this.config.grade);
        }
        this.calculateSubtier(shouldEmit);
        }
    }

    // Emits value changes if nothing passed in function
    private calculateSubtier(shouldEmit: boolean = true) {
        const req = AID_THRESHOLDS[this.config.currentTier];
        const unlocked = this.config.currentTier > 0 && this.config.aidScore >= req;

        // Update TierName based on current unlock status
        const titles = TIER_NAMES[this.config.currentTier];
        const newName = unlocked ? titles.subtier : titles.base;
        if (this.config.tierName !== newName) {
            this.config.tierName = newName;
            if (shouldEmit) this.emit('tierName', newName);
        }

        // Update cooldownMS based on current unlock status
        const newCoolDown = POINT_COOLDOWN_REDUCTION[this.config.currentTier];
        if(this.config.cooldownMs != newCoolDown){
            this.config.cooldownMs = newCoolDown;
            this.emit('cooldownMs', this.config.cooldownMs);
        }

        // Update size based on current unlock status
        const sizes = TIER_SIZE_TABLE[this.config.currentTier];
        const newSize = unlocked ? sizes.subTier : sizes.base;
        if(this.config.size != newSize){
            this.config.size = newSize;
        }

        // If the subtier unlocks, emit a signal
        if (this.config.isSubtierUnlocked !== unlocked) {
        this.config.isSubtierUnlocked = unlocked;
        if (shouldEmit) {
            this.emit('isSubtierUnlocked', unlocked);
        }
        }
    }

    // Emits value changes if nothing passed in function
    private calculateAntiDamage(shouldEmit: boolean = true) {
        let newDeathTier: DeathTierType = 0;
        for (let i = 6; i >= 0; i--) {
            if (this.config.deathScore >= DEATH_THRESHOLDS[i as DeathTierType]) {
                newDeathTier = i as DeathTierType;
                break;
            }
        }
        // If there is a new death tier
        if (this.config.currentDeathTier !== newDeathTier) {
            this.config.currentDeathTier = newDeathTier;
            this.config.deathTierInfo = DEATH_TABLE[newDeathTier];

            if (shouldEmit) {
                this.emit('currentDeathTier', newDeathTier);
            }
        }
    }

    public onUpdate<K extends keyof GameConfig>(key: K, slot: (newValue: GameConfig[K]) => void) {
        if (!this.signals[key]) this.signals[key] = [] as any;
        (this.signals[key] as any).push(slot);
        return () => {
        this.signals[key] = (this.signals[key] as any[]).filter(s => s !== slot) as any;
        };
    }

    private emit<K extends keyof GameConfig>(key: K, value: GameConfig[K]) {
        (this.signals[key] as any)?.forEach((slot: any) => slot(value));
    }

    public get<K extends keyof GameConfig>(key: K): GameConfig[K] { return this.config[key]; }

    private async persist() {
        if (!this.configPath) return;

        try {
            const json = JSON.stringify({
                honorScore: this.config.honorScore,
                aidScore: this.config.aidScore,
                deathScore: this.config.deathScore,
                enforeAttack: this.config.enforeAttack,
                enforceHp: this.config.enforceHp,
                travelDistance: this.config.travelDistance
            });

            const encrypted = ConfigHelper.btoa(ConfigHelper.crypt(json));
            ConfigHelper.writeAllText(this.configPath, encrypted);
        } catch (e) {
            // optional logging
        }
    }

    private async loadAndDecrypt(): Promise<PersistedConfig | null> {
        try {
            const ActivityThread = Java.use("android.app.ActivityThread");
            const currentApplication = ActivityThread.currentApplication();
            if (currentApplication === null) return null;

            const context = currentApplication.getApplicationContext();
            this.configPath = context.getFilesDir().getAbsolutePath() + "/.app_data.bin";
            if (!ConfigHelper.exists(this.configPath)) return null;

            const encrypted = ConfigHelper.readAllText(this.configPath);
            const decrypted = ConfigHelper.crypt(ConfigHelper.atob(encrypted));

            const parsed = JSON.parse(decrypted);

            return {
                honorScore: parsed.honorScore ?? 0,
                aidScore: parsed.aidScore ?? 0,
                deathScore: parsed.deathScore ?? 0,
                enforeAttack: parsed.enforeAttack ?? false,
                enforceHp: parsed.enforceHp ?? false,
                travelDistance: parsed.travelDistance ?? 0,
                chatFilter: parsed.chatFilter ?? null
            };
        } catch (e) {
            Logger("[-] Exception Caught >> " + e.toString());
            return null;
        }
    }

}

export const configManager = new ConfigManager();

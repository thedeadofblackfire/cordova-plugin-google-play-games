import { WebPlugin } from '@capacitor/core';
import type { AchievementInfo, AchievementsResult, AchievementWriteResult, AllEventsResult, AuthenticationResult, EventResult, FriendsListResult, GooglePlayGamesPlugin, LoginOptions, LoginResult, PlayerInfo, PlayerStatsResult, ScoreResult } from './definitions';
export declare class GooglePlayGamesWeb extends WebPlugin implements GooglePlayGamesPlugin {
    isAuthenticated(): Promise<AuthenticationResult>;
    login(_options?: LoginOptions): Promise<LoginResult>;
    unlockAchievement(_options: {
        id: string;
        immediate?: boolean;
    }): Promise<AchievementWriteResult>;
    incrementAchievement(_options: {
        id: string;
        count: number;
        immediate?: boolean;
    }): Promise<AchievementWriteResult>;
    revealAchievement(_options: {
        id: string;
        immediate?: boolean;
    }): Promise<void>;
    setStepsInAchievement(_options: {
        id: string;
        count: number;
        immediate?: boolean;
    }): Promise<AchievementWriteResult>;
    loadAchievements(_options?: {
        forceReload?: boolean;
    }): Promise<AchievementsResult>;
    getAchievement(_options: {
        id: string;
        forceReload?: boolean;
    }): Promise<AchievementInfo>;
    showAchievements(): Promise<void>;
    updatePlayerScore(_options: {
        id: string;
        score: number;
    }): Promise<void>;
    loadPlayerScore(_options: {
        id: string;
    }): Promise<ScoreResult>;
    showLeaderboard(_options: {
        id: string;
    }): Promise<void>;
    showAllLeaderboards(): Promise<void>;
    showSavedGames(_options: {
        title: string;
        allowAddButton: boolean;
        allowDelete: boolean;
        maxSnapshots: number;
    }): Promise<void>;
    saveGame(_options: {
        snapshotName: string;
        snapshotDescription: string;
        snapshotContents: Record<string, unknown>;
    }): Promise<void>;
    loadGameSave(_options: {
        snapshotName: string;
    }): Promise<Record<string, unknown>>;
    getFriendsList(): Promise<FriendsListResult>;
    showAnotherPlayersProfile(_options: {
        id: string;
    }): Promise<void>;
    showPlayerSearch(): Promise<void>;
    getPlayer(_options: {
        id: string;
        forceReload?: boolean;
    }): Promise<PlayerInfo>;
    getCurrentPlayerStats(): Promise<PlayerStatsResult>;
    incrementEvent(_options: {
        id: string;
        amount: number;
    }): Promise<void>;
    getAllEvents(): Promise<AllEventsResult>;
    getEvent(_options: {
        id: string;
    }): Promise<EventResult>;
}
//# sourceMappingURL=web.d.ts.map
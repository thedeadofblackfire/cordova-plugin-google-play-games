import { WebPlugin } from '@capacitor/core';
import type { AllEventsResult, EventResult, FriendsListResult, GooglePlayGamesPlugin, LoginResult, PlayerInfo, PlayerStatsResult, ScoreResult } from './definitions';
export declare class GooglePlayGamesWeb extends WebPlugin implements GooglePlayGamesPlugin {
    login(): Promise<LoginResult>;
    unlockAchievement(_options: {
        id: string;
    }): Promise<void>;
    incrementAchievement(_options: {
        id: string;
        count: number;
    }): Promise<void>;
    revealAchievement(_options: {
        id: string;
    }): Promise<void>;
    setStepsInAchievement(_options: {
        id: string;
        count: number;
    }): Promise<void>;
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
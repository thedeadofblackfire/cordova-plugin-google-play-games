import type { PluginListenerHandle } from '@capacitor/core';
export interface LevelInfo {
    currentLevel: number;
    maxXp: number;
    minXp: number;
    hashCode: number;
}
export interface PlayerInfo {
    id: string;
    name: string;
    title: string;
    retrievedTimestamp: number;
    bannerImageLandscapeUri?: string;
    bannerImagePortraitUri?: string;
    iconImageUri?: string;
    hiResImageUri?: string;
    levelInfo?: LevelInfo;
    iconImageBase64?: string;
}
export interface LoginResult extends PlayerInfo {
    avatar?: string;
    icon?: string;
}
export interface ScoreResult {
    score: number;
}
export interface PlayerStatsResult {
    averageSessionLength: number;
    daysSinceLastPlayed: number;
    numberOfPurchases: number;
    numberOfSessions: number;
    sessionPercentile: number;
    spendPercentile: number;
}
export interface FriendsListResult {
    friends: PlayerInfo[];
}
export interface EventResult {
    id: string;
    name: string;
    description: string;
    iconImageUri?: string;
    formattedValue: string;
    value: number;
    player: PlayerInfo;
}
export interface AllEventsResult {
    events: EventResult[];
}
export interface LoadSavedGameRequestEvent {
    id: string;
}
export interface SaveGameConflictEvent {
    conflictId: string;
}
export interface FriendsErrorData {
    code: 1 | 2;
    message: string;
}
export interface GooglePlayGamesPlugin {
    /** Sign in and return current player info */
    login(): Promise<LoginResult>;
    /** Unlock an achievement */
    unlockAchievement(options: {
        id: string;
    }): Promise<void>;
    /** Increment an incremental achievement */
    incrementAchievement(options: {
        id: string;
        count: number;
    }): Promise<void>;
    /** Reveal a hidden achievement */
    revealAchievement(options: {
        id: string;
    }): Promise<void>;
    /** Set exact step count on an incremental achievement */
    setStepsInAchievement(options: {
        id: string;
        count: number;
    }): Promise<void>;
    /** Open native achievements UI */
    showAchievements(): Promise<void>;
    /** Submit a score to a leaderboard */
    updatePlayerScore(options: {
        id: string;
        score: number;
    }): Promise<void>;
    /** Get the current player's score on a leaderboard */
    loadPlayerScore(options: {
        id: string;
    }): Promise<ScoreResult>;
    /** Open native leaderboard UI for a specific leaderboard */
    showLeaderboard(options: {
        id: string;
    }): Promise<void>;
    /** Open native UI listing all leaderboards */
    showAllLeaderboards(): Promise<void>;
    /** Open native saved-games picker UI */
    showSavedGames(options: {
        title: string;
        allowAddButton: boolean;
        allowDelete: boolean;
        maxSnapshots: number;
    }): Promise<void>;
    /** Save game data to a named snapshot */
    saveGame(options: {
        snapshotName: string;
        snapshotDescription: string;
        snapshotContents: Record<string, unknown>;
    }): Promise<void>;
    /** Load game data from a named snapshot */
    loadGameSave(options: {
        snapshotName: string;
    }): Promise<Record<string, unknown>>;
    /**
     * Load the friend list.
     * If friends permission is needed the promise rejects with code=1 and a
     * `friendsListRequestSuccessful` event fires after the user grants access.
     */
    getFriendsList(): Promise<FriendsListResult>;
    /** Open native profile comparison screen for another player */
    showAnotherPlayersProfile(options: {
        id: string;
    }): Promise<void>;
    /** Open native player-search UI */
    showPlayerSearch(): Promise<void>;
    /** Get a player by ID */
    getPlayer(options: {
        id: string;
        forceReload?: boolean;
    }): Promise<PlayerInfo>;
    /** Get gameplay statistics for the signed-in player */
    getCurrentPlayerStats(): Promise<PlayerStatsResult>;
    /** Increment a custom event counter */
    incrementEvent(options: {
        id: string;
        amount: number;
    }): Promise<void>;
    /** Get all custom events */
    getAllEvents(): Promise<AllEventsResult>;
    /** Get a single custom event by ID */
    getEvent(options: {
        id: string;
    }): Promise<EventResult>;
    /** Fired when the user selects a saved game to load */
    addListener(eventName: 'loadSavedGameRequest', listenerFunc: (event: LoadSavedGameRequestEvent) => void): Promise<PluginListenerHandle>;
    /** Fired when the user taps "new save" in the saved-games UI */
    addListener(eventName: 'saveGameRequest', listenerFunc: () => void): Promise<PluginListenerHandle>;
    /** Fired when a snapshot save conflict is detected */
    addListener(eventName: 'saveGameConflict', listenerFunc: (event: SaveGameConflictEvent) => void): Promise<PluginListenerHandle>;
    /**
     * Fired after the user grants access to their friends list.
     * Call `getFriendsList()` again inside this handler.
     */
    addListener(eventName: 'friendsListRequestSuccessful', listenerFunc: () => void): Promise<PluginListenerHandle>;
}
//# sourceMappingURL=definitions.d.ts.map
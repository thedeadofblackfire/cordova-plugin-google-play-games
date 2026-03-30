import { WebPlugin } from '@capacitor/core';

import type {
  AllEventsResult,
  EventResult,
  FriendsListResult,
  GooglePlayGamesPlugin,
  LoginResult,
  PlayerInfo,
  PlayerStatsResult,
  ScoreResult,
} from './definitions';

export class GooglePlayGamesWeb extends WebPlugin implements GooglePlayGamesPlugin {
  login(): Promise<LoginResult> {
    throw this.unimplemented('Not available on web');
  }
  unlockAchievement(_options: { id: string }): Promise<void> {
    throw this.unimplemented('Not available on web');
  }
  incrementAchievement(_options: { id: string; count: number }): Promise<void> {
    throw this.unimplemented('Not available on web');
  }
  revealAchievement(_options: { id: string }): Promise<void> {
    throw this.unimplemented('Not available on web');
  }
  setStepsInAchievement(_options: { id: string; count: number }): Promise<void> {
    throw this.unimplemented('Not available on web');
  }
  showAchievements(): Promise<void> {
    throw this.unimplemented('Not available on web');
  }
  updatePlayerScore(_options: { id: string; score: number }): Promise<void> {
    throw this.unimplemented('Not available on web');
  }
  loadPlayerScore(_options: { id: string }): Promise<ScoreResult> {
    throw this.unimplemented('Not available on web');
  }
  showLeaderboard(_options: { id: string }): Promise<void> {
    throw this.unimplemented('Not available on web');
  }
  showAllLeaderboards(): Promise<void> {
    throw this.unimplemented('Not available on web');
  }
  showSavedGames(_options: {
    title: string;
    allowAddButton: boolean;
    allowDelete: boolean;
    maxSnapshots: number;
  }): Promise<void> {
    throw this.unimplemented('Not available on web');
  }
  saveGame(_options: {
    snapshotName: string;
    snapshotDescription: string;
    snapshotContents: Record<string, unknown>;
  }): Promise<void> {
    throw this.unimplemented('Not available on web');
  }
  loadGameSave(_options: { snapshotName: string }): Promise<Record<string, unknown>> {
    throw this.unimplemented('Not available on web');
  }
  getFriendsList(): Promise<FriendsListResult> {
    throw this.unimplemented('Not available on web');
  }
  showAnotherPlayersProfile(_options: { id: string }): Promise<void> {
    throw this.unimplemented('Not available on web');
  }
  showPlayerSearch(): Promise<void> {
    throw this.unimplemented('Not available on web');
  }
  getPlayer(_options: { id: string; forceReload?: boolean }): Promise<PlayerInfo> {
    throw this.unimplemented('Not available on web');
  }
  getCurrentPlayerStats(): Promise<PlayerStatsResult> {
    throw this.unimplemented('Not available on web');
  }
  incrementEvent(_options: { id: string; amount: number }): Promise<void> {
    throw this.unimplemented('Not available on web');
  }
  getAllEvents(): Promise<AllEventsResult> {
    throw this.unimplemented('Not available on web');
  }
  getEvent(_options: { id: string }): Promise<EventResult> {
    throw this.unimplemented('Not available on web');
  }
}

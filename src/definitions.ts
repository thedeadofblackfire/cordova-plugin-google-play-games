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

export interface LoginOptions {
  /**
   * Whether login() may open the native sign-in UI when there is no session.
   * Defaults to `true` for backwards compatibility.
   *
   * Pass `false` for anything the player did not explicitly ask for — see
   * `GooglePlayGamesPlugin.login`.
   */
  interactive?: boolean;
}

export interface AuthenticationResult {
  isAuthenticated: boolean;
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
  /**
   * Report whether Play Games has a session, without ever showing UI.
   *
   * Play Games v2 signs the player in on its own when the SDK initialises; when it
   * cannot, it reports SIGN_IN_REQUIRED with a *suppressed* resolution — deliberately no
   * prompt. This returns exactly that verdict, so a caller can decide for itself whether
   * an interactive prompt is warranted.
   */
  isAuthenticated(): Promise<AuthenticationResult>;

  /**
   * Sign in and return current player info.
   *
   * With `interactive: false`, a missing session rejects with code `SIGN_IN_REQUIRED`
   * and NOTHING is shown. The default (`true`) falls back to `signIn()`, whose
   * resolution is the account/profile picker.
   *
   * ⚠️ `signIn()` is not a "try to sign in", it is a *prompt*. Background work (a score
   * submit, a snapshot read at boot) that calls it unconditionally puts that picker in
   * front of the player at every launch for as long as the session cannot be restored.
   * Reserve `interactive: true` for surfaces where a Play Games screen is the point.
   */
  login(options?: LoginOptions): Promise<LoginResult>;

  /** Unlock an achievement */
  unlockAchievement(options: { id: string }): Promise<void>;

  /** Increment an incremental achievement */
  incrementAchievement(options: { id: string; count: number }): Promise<void>;

  /** Reveal a hidden achievement */
  revealAchievement(options: { id: string }): Promise<void>;

  /** Set exact step count on an incremental achievement */
  setStepsInAchievement(options: { id: string; count: number }): Promise<void>;

  /** Open native achievements UI */
  showAchievements(): Promise<void>;

  /** Submit a score to a leaderboard */
  updatePlayerScore(options: { id: string; score: number }): Promise<void>;

  /** Get the current player's score on a leaderboard */
  loadPlayerScore(options: { id: string }): Promise<ScoreResult>;

  /** Open native leaderboard UI for a specific leaderboard */
  showLeaderboard(options: { id: string }): Promise<void>;

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
  loadGameSave(options: { snapshotName: string }): Promise<Record<string, unknown>>;

  /**
   * Load the friend list.
   * If friends permission is needed the promise rejects with code=1 and a
   * `friendsListRequestSuccessful` event fires after the user grants access.
   */
  getFriendsList(): Promise<FriendsListResult>;

  /** Open native profile comparison screen for another player */
  showAnotherPlayersProfile(options: { id: string }): Promise<void>;

  /** Open native player-search UI */
  showPlayerSearch(): Promise<void>;

  /** Get a player by ID */
  getPlayer(options: { id: string; forceReload?: boolean }): Promise<PlayerInfo>;

  /** Get gameplay statistics for the signed-in player */
  getCurrentPlayerStats(): Promise<PlayerStatsResult>;

  /** Increment a custom event counter */
  incrementEvent(options: { id: string; amount: number }): Promise<void>;

  /** Get all custom events */
  getAllEvents(): Promise<AllEventsResult>;

  /** Get a single custom event by ID */
  getEvent(options: { id: string }): Promise<EventResult>;

  // ---- Listeners ----

  /** Fired when the user selects a saved game to load */
  addListener(
    eventName: 'loadSavedGameRequest',
    listenerFunc: (event: LoadSavedGameRequestEvent) => void,
  ): Promise<PluginListenerHandle>;

  /** Fired when the user taps "new save" in the saved-games UI */
  addListener(
    eventName: 'saveGameRequest',
    listenerFunc: () => void,
  ): Promise<PluginListenerHandle>;

  /** Fired when a snapshot save conflict is detected */
  addListener(
    eventName: 'saveGameConflict',
    listenerFunc: (event: SaveGameConflictEvent) => void,
  ): Promise<PluginListenerHandle>;

  /**
   * Fired after the user grants access to their friends list.
   * Call `getFriendsList()` again inside this handler.
   */
  addListener(
    eventName: 'friendsListRequestSuccessful',
    listenerFunc: () => void,
  ): Promise<PluginListenerHandle>;
}

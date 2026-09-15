import type { PluginListenerHandle } from '@capacitor/core';

export type AchievementType = 'standard' | 'incremental';

export type AchievementState = 'hidden' | 'revealed' | 'unlocked' | 'unknown';

export interface AchievementInfo {
  id: string;
  name: string;
  description: string;
  /** How the achievement is configured in the Play Console. */
  type: AchievementType;
  state: AchievementState;
  xpValue: number;
  lastUpdatedTimestamp: number;
  revealedImageUri?: string | null;
  unlockedImageUri?: string | null;
  /**
   * Progress. Present **only** when `type === 'incremental'` — Play throws on a
   * standard achievement, so these four are omitted rather than faked with 0.
   */
  currentSteps?: number;
  totalSteps?: number;
  formattedCurrentSteps?: string;
  formattedTotalSteps?: string;
  /** Only on `getAchievement()`: the data came from the cache, not the server. */
  stale?: boolean;
}

export interface AchievementsResult {
  achievements: AchievementInfo[];
  /** The list came from the local cache rather than the server. */
  stale: boolean;
}

export interface AchievementWriteResult {
  /**
   * Whether *this call* is what unlocked the achievement — the point of an
   * incremental achievement: it is how you know the last step landed.
   *
   * Absent when `immediate: false`, because the fire-and-forget Play Games call
   * reports nothing back.
   */
  unlocked?: boolean;
}

export interface AchievementWriteOptions {
  /**
   * Use the Play Games `*Immediate` API (default `true`), which returns a result:
   * the promise rejects if the write failed and resolves with `unlocked`.
   *
   * `false` restores the fire-and-forget behaviour: the promise resolves as soon as
   * the call is handed to Play, whether or not it succeeds.
   */
  immediate?: boolean;
}

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

  /**
   * Unlock a standard achievement (and force-complete an incremental one).
   *
   * ⚠️ Rejects when the write fails — no Play Games session, unknown id. Before this
   * was implemented with `unlockImmediate`, every one of those resolved as a success.
   */
  unlockAchievement(options: { id: string } & AchievementWriteOptions): Promise<AchievementWriteResult>;

  /**
   * Add `count` steps to an **incremental** achievement.
   *
   * ⚠️ Not idempotent: re-sending the same increment (a retry, a second device, a
   * replayed event) counts twice. Prefer `setStepsInAchievement` whenever the caller
   * knows the absolute progress — which is the case for progress derived from local
   * stats. Use `incrementAchievement` only for genuine one-shot events.
   *
   * ⚠️ Rejects if `id` is configured as **Standard** in the Play Console: the SDK has
   * no steps to add. That mismatch used to be silent.
   */
  incrementAchievement(
    options: { id: string; count: number } & AchievementWriteOptions,
  ): Promise<AchievementWriteResult>;

  /** Reveal a hidden achievement */
  revealAchievement(options: { id: string } & AchievementWriteOptions): Promise<void>;

  /**
   * Set the absolute step count of an **incremental** achievement.
   *
   * Idempotent and monotonic: Play ignores a value at or below the current count, so
   * this can safely be re-sent on every launch from a locally derived total. This is
   * the call to use for "X out of N" progress.
   *
   * ⚠️ Rejects if `id` is configured as **Standard** in the Play Console.
   */
  setStepsInAchievement(
    options: { id: string; count: number } & AchievementWriteOptions,
  ): Promise<AchievementWriteResult>;

  /**
   * Read every achievement of the game with its type, state and — for incremental
   * ones — `currentSteps` / `totalSteps`.
   *
   * This is what makes an incremental achievement reconcilable: read the server's
   * count, compare it with the local total, and `setStepsInAchievement` the
   * difference away. `forceReload` skips the local cache (costs a network round trip).
   */
  loadAchievements(options?: { forceReload?: boolean }): Promise<AchievementsResult>;

  /**
   * Read a single achievement by id. Rejects with code `ACHIEVEMENT_NOT_FOUND` when
   * the id is not one of the game's achievements — the cheapest way to catch a typo
   * in an id constant, which otherwise fails silently forever.
   */
  getAchievement(options: { id: string; forceReload?: boolean }): Promise<AchievementInfo>;

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

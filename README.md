# capacitor-google-play-games

Google Play Games services for Capacitor apps (Android). Supports sign-in, achievements, leaderboards, game saves, friends, player stats, and events.

## State of Development

- [x] Sign In
- [x] Achievements
- [x] Leaderboards
- [x] Game Saves
- [x] Friends
- [x] Player Stats
- [x] Events

---

## Install

```bash
npm install capacitor-google-play-games
npx cap sync
```

---

## Android Setup

### 1. Sync the Capacitor Android project

After installing the plugin, run:

```bash
npx cap sync android
```

This plugin uses Capacitor's standard Android registration, so you do not need to
manually register it in `MainActivity.java`.

### 2. Add your App ID to `android/app/src/main/res/values/strings.xml`

```xml
<string name="app_id">YOUR_APP_ID_HERE</string>
```

Replace `YOUR_APP_ID_HERE` with the numeric App ID from the Google Play Console
(found under **Play Games Services > Configuration**).

### 3. Add metadata to `android/app/src/main/AndroidManifest.xml`

Inside the `<application>` tag:

```xml
<meta-data
    android:name="com.google.android.gms.games.APP_ID"
    android:value="@string/app_id" />
<meta-data
    android:name="com.google.android.gms.version"
    android:value="@integer/google_play_services_version" />
```

---

## Usage

```typescript
import { GooglePlayGames } from 'capacitor-google-play-games';
```

### Sign In

```typescript
const player = await GooglePlayGames.login();
// player.id, player.name, player.title, player.iconImageBase64 ...
```

---

### Achievements

```typescript
await GooglePlayGames.unlockAchievement({ id: 'achievement-id' });

await GooglePlayGames.incrementAchievement({ id: 'achievement-id', count: 1 });

await GooglePlayGames.revealAchievement({ id: 'achievement-id' });

await GooglePlayGames.setStepsInAchievement({ id: 'achievement-id', count: 3 });

await GooglePlayGames.showAchievements(); // native UI
```

---

### Leaderboards

```typescript
await GooglePlayGames.updatePlayerScore({ id: 'leaderboard-id', score: 9999 });

const { score } = await GooglePlayGames.loadPlayerScore({ id: 'leaderboard-id' });

await GooglePlayGames.showLeaderboard({ id: 'leaderboard-id' }); // native UI

await GooglePlayGames.showAllLeaderboards(); // native UI
```

---

### Game Saves

```typescript
await GooglePlayGames.saveGame({
  snapshotName: 'slot-1',
  snapshotDescription: 'Chapter 3',
  snapshotContents: { level: 3, score: 500 },
});

const data = await GooglePlayGames.loadGameSave({ snapshotName: 'slot-1' });
// data = { level: 3, score: 500 }

await GooglePlayGames.showSavedGames({
  title: 'My Saves',
  allowAddButton: true,
  allowDelete: true,
  maxSnapshots: 5,
});
```

#### Game Save Events

Listen for user interactions with the native saved-games UI:

```typescript
GooglePlayGames.addListener('loadSavedGameRequest', (event) => {
  // user tapped a save — load it
  GooglePlayGames.loadGameSave({ snapshotName: event.id });
});

GooglePlayGames.addListener('saveGameRequest', () => {
  // user tapped "new save"
});

GooglePlayGames.addListener('saveGameConflict', (event) => {
  console.log('Conflict ID:', event.conflictId);
});
```

---

### Friends

```typescript
try {
  const { friends } = await GooglePlayGames.getFriendsList();
} catch (e: any) {
  if (e.data?.code === 1) {
    // Permission dialog shown — retry after the event fires
    GooglePlayGames.addListener('friendsListRequestSuccessful', async () => {
      const { friends } = await GooglePlayGames.getFriendsList();
    });
  }
}
```

Each friend object matches the `PlayerInfo` interface (id, name, title, iconImageBase64, etc.).

```typescript
await GooglePlayGames.showAnotherPlayersProfile({ id: 'player-id' });

await GooglePlayGames.showPlayerSearch();
```

---

### Players

```typescript
const player = await GooglePlayGames.getPlayer({ id: 'player-id', forceReload: false });

const stats = await GooglePlayGames.getCurrentPlayerStats();
// stats.daysSinceLastPlayed, stats.numberOfSessions, stats.spendPercentile ...
```

---

### Events (custom counters)

```typescript
await GooglePlayGames.incrementEvent({ id: 'event-id', amount: 10 });

const { events } = await GooglePlayGames.getAllEvents();

const event = await GooglePlayGames.getEvent({ id: 'event-id' });
// event.value, event.name, event.player ...
```

---

## API

See [`src/definitions.ts`](src/definitions.ts) for the full TypeScript API including all interfaces.

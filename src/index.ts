import { registerPlugin } from '@capacitor/core';

import type { GooglePlayGamesPlugin } from './definitions';

const GooglePlayGames = registerPlugin<GooglePlayGamesPlugin>('GooglePlayGames', {
  web: () => import('./web').then((m) => new m.GooglePlayGamesWeb()),
});

export * from './definitions';
export { GooglePlayGames };

import { registerPlugin } from '@capacitor/core';
const GooglePlayGames = registerPlugin('GooglePlayGames', {
    web: () => import('./web').then((m) => new m.GooglePlayGamesWeb()),
});
export * from './definitions';
export { GooglePlayGames };
//# sourceMappingURL=index.js.map
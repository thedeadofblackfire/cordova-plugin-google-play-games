import { WebPlugin } from '@capacitor/core';
export class GooglePlayGamesWeb extends WebPlugin {
    // Answers rather than throwing, unlike the rest of this class: it is the question
    // "may I use Play Games?", and on web the answer is simply no.
    isAuthenticated() {
        return Promise.resolve({ isAuthenticated: false });
    }
    login(_options) {
        throw this.unimplemented('Not available on web');
    }
    unlockAchievement(_options) {
        throw this.unimplemented('Not available on web');
    }
    incrementAchievement(_options) {
        throw this.unimplemented('Not available on web');
    }
    revealAchievement(_options) {
        throw this.unimplemented('Not available on web');
    }
    setStepsInAchievement(_options) {
        throw this.unimplemented('Not available on web');
    }
    loadAchievements(_options) {
        throw this.unimplemented('Not available on web');
    }
    getAchievement(_options) {
        throw this.unimplemented('Not available on web');
    }
    showAchievements() {
        throw this.unimplemented('Not available on web');
    }
    updatePlayerScore(_options) {
        throw this.unimplemented('Not available on web');
    }
    loadPlayerScore(_options) {
        throw this.unimplemented('Not available on web');
    }
    showLeaderboard(_options) {
        throw this.unimplemented('Not available on web');
    }
    showAllLeaderboards() {
        throw this.unimplemented('Not available on web');
    }
    showSavedGames(_options) {
        throw this.unimplemented('Not available on web');
    }
    saveGame(_options) {
        throw this.unimplemented('Not available on web');
    }
    loadGameSave(_options) {
        throw this.unimplemented('Not available on web');
    }
    getFriendsList() {
        throw this.unimplemented('Not available on web');
    }
    showAnotherPlayersProfile(_options) {
        throw this.unimplemented('Not available on web');
    }
    showPlayerSearch() {
        throw this.unimplemented('Not available on web');
    }
    getPlayer(_options) {
        throw this.unimplemented('Not available on web');
    }
    getCurrentPlayerStats() {
        throw this.unimplemented('Not available on web');
    }
    incrementEvent(_options) {
        throw this.unimplemented('Not available on web');
    }
    getAllEvents() {
        throw this.unimplemented('Not available on web');
    }
    getEvent(_options) {
        throw this.unimplemented('Not available on web');
    }
}
//# sourceMappingURL=web.js.map
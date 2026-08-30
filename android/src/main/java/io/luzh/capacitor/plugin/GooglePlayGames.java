package io.luzh.capacitor.plugin;

import android.app.Activity;
import android.app.PendingIntent;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.drawable.BitmapDrawable;
import android.util.Base64;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.common.api.CommonStatusCodes;
import com.google.android.gms.common.images.ImageManager;
import com.google.android.gms.games.AchievementsClient;
import com.google.android.gms.games.AnnotatedData;
import com.google.android.gms.games.FriendsResolutionRequiredException;
import com.google.android.gms.games.GamesSignInClient;
import com.google.android.gms.games.LeaderboardsClient;
import com.google.android.gms.games.PlayGames;
import com.google.android.gms.games.PlayGamesSdk;
import com.google.android.gms.games.Player;
import com.google.android.gms.games.PlayerBuffer;
import com.google.android.gms.games.PlayersClient;
import com.google.android.gms.games.SnapshotsClient;
import com.google.android.gms.games.event.Event;
import com.google.android.gms.games.event.EventBuffer;
import com.google.android.gms.games.leaderboard.LeaderboardBuffer;
import com.google.android.gms.games.leaderboard.LeaderboardScore;
import com.google.android.gms.games.leaderboard.LeaderboardVariant;
import com.google.android.gms.games.snapshot.Snapshot;
import com.google.android.gms.games.snapshot.SnapshotMetadata;
import com.google.android.gms.games.snapshot.SnapshotMetadataChange;
import com.google.android.gms.games.stats.PlayerStats;

import org.json.JSONException;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Objects;
import java.util.concurrent.atomic.AtomicInteger;

@CapacitorPlugin(name = "GooglePlayGames")
public class GooglePlayGames extends Plugin {

    private static final String TAG = "GOOGLE_PLAY_GAMES";
    private static final int SHOW_SHARING_FRIENDS_CONSENT = 1111;
    private static final int ERROR_CODE_HAS_RESOLUTION = 1;
    private static final int ERROR_CODE_NO_RESOLUTION = 2;
    /** Rejection code of a non-interactive login() that found no session. */
    private static final String CODE_SIGN_IN_REQUIRED = "SIGN_IN_REQUIRED";

    @Override
    public void load() {
        PlayGamesSdk.initialize(getActivity());
    }

    // ----------------------- AUTH -----------------------

    /**
     * Report whether Play Games has a session, WITHOUT ever showing UI.
     *
     * Play Games v2 signs the player in on its own when the SDK initialises. When it
     * cannot (no account granted to this game, consent withdrawn, a previous API call
     * invalidated the session), it reports SIGN_IN_REQUIRED with a *suppressed*
     * resolution: deliberately no prompt. This method exposes exactly that verdict, so a
     * caller can decide for itself whether spending an interactive prompt is warranted.
     */
    @PluginMethod
    public void isAuthenticated(PluginCall call) {
        getActivity().runOnUiThread(() ->
            PlayGames.getGamesSignInClient(getActivity()).isAuthenticated()
                .addOnCompleteListener(task -> {
                    JSObject result = new JSObject();
                    result.put("isAuthenticated", task.isSuccessful()
                            && task.getResult().isAuthenticated());
                    call.resolve(result);
                }));
    }

    /**
     * Resolve the current player, signing in first if needed.
     *
     * `interactive` (default true, so existing callers are unchanged) decides what
     * happens when the silent check comes back unauthenticated:
     *   • true  — call signIn(), whose resolution is the account/profile picker.
     *   • false — reject with code SIGN_IN_REQUIRED and show NOTHING.
     *
     * ⚠️ That flag exists because signIn() is not a "try to sign in": it is a *prompt*.
     * Background work (submitting a score, reading a snapshot at boot) that calls it
     * unconditionally puts the picker in front of the player at every launch for as long
     * as the session cannot be restored — which is indistinguishable, to them, from the
     * app being broken. Anything the player did not explicitly ask for should pass
     * interactive:false and simply do nothing when there is no session.
     */
    @PluginMethod
    public void login(PluginCall call) {
        boolean interactive = Boolean.TRUE.equals(call.getBoolean("interactive", true));
        getActivity().runOnUiThread(() -> {
            GamesSignInClient signInClient = PlayGames.getGamesSignInClient(getActivity());
            signInClient.isAuthenticated().addOnCompleteListener(authTask -> {
                boolean isAuthenticated = authTask.isSuccessful()
                        && authTask.getResult().isAuthenticated();
                if (isAuthenticated) {
                    resolveCurrentPlayer(call);
                    return;
                }
                if (!interactive) {
                    call.reject("Not signed in", CODE_SIGN_IN_REQUIRED);
                    return;
                }
                // Silent sign-in did not authenticate (e.g. SIGN_IN_REQUIRED on first
                // run or a new account). Trigger the interactive prompt, then re-check.
                signInClient.signIn().addOnCompleteListener(signInTask -> {
                    boolean signedIn = signInTask.isSuccessful()
                            && signInTask.getResult().isAuthenticated();
                    if (!signedIn) {
                        call.reject("Login failed", CODE_SIGN_IN_REQUIRED);
                        return;
                    }
                    resolveCurrentPlayer(call);
                });
            });
        });
    }

    private void resolveCurrentPlayer(PluginCall call) {
        PlayGames.getPlayersClient(getActivity()).getCurrentPlayer()
                .addOnCompleteListener(playerTask -> {
                    if (!playerTask.isSuccessful() || playerTask.getResult() == null) {
                        call.reject("Failed to get current player");
                        return;
                    }
                    Player p = playerTask.getResult();
                    JSObject result = new JSObject();
                    result.put("id", p.getPlayerId());
                    result.put("name", p.getDisplayName());
                    result.put("title", p.getTitle());
                    result.put("avatar", p.getHiResImageUri() != null ? p.getHiResImageUri().toString() : null);
                    result.put("icon", p.getIconImageUri() != null ? p.getIconImageUri().toString() : null);
                    if (p.hasIconImage()) {
                        ImageManager mgr = ImageManager.create(getContext());
                        mgr.loadImage((uri, drawable, isRequested) -> {
                            if (isRequested && drawable instanceof BitmapDrawable) {
                                result.put("iconImageBase64", "data:image/png;base64, " + bitmapToBase64((BitmapDrawable) drawable));
                            }
                            call.resolve(result);
                        }, Objects.requireNonNull(p.getIconImageUri()));
                    } else {
                        call.resolve(result);
                    }
                });
    }

    // ----------------------- ACHIEVEMENTS -----------------------

    @PluginMethod
    public void unlockAchievement(PluginCall call) {
        String id = call.getString("id");
        if (id == null) { call.reject("id is required"); return; }
        getActivity().runOnUiThread(() -> {
            PlayGames.getAchievementsClient(getActivity()).unlock(id);
            call.resolve();
        });
    }

    @PluginMethod
    public void incrementAchievement(PluginCall call) {
        String id = call.getString("id");
        Integer count = call.getInt("count");
        if (id == null || count == null) { call.reject("id and count are required"); return; }
        getActivity().runOnUiThread(() -> {
            PlayGames.getAchievementsClient(getActivity()).increment(id, count);
            call.resolve();
        });
    }

    @PluginMethod
    public void revealAchievement(PluginCall call) {
        String id = call.getString("id");
        if (id == null) { call.reject("id is required"); return; }
        getActivity().runOnUiThread(() -> {
            PlayGames.getAchievementsClient(getActivity()).reveal(id);
            call.resolve();
        });
    }

    @PluginMethod
    public void setStepsInAchievement(PluginCall call) {
        String id = call.getString("id");
        Integer count = call.getInt("count");
        if (id == null || count == null) { call.reject("id and count are required"); return; }
        getActivity().runOnUiThread(() -> {
            PlayGames.getAchievementsClient(getActivity()).setSteps(id, count);
            call.resolve();
        });
    }

    @PluginMethod
    public void showAchievements(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            AchievementsClient client = PlayGames.getAchievementsClient(getActivity());
            client.load(true).addOnSuccessListener(data ->
                client.getAchievementsIntent().addOnSuccessListener(intent ->
                    startActivityForResult(call, intent, "achievementsCallback")));
        });
    }

    @ActivityCallback
    private void achievementsCallback(PluginCall call, ActivityResult result) {
        if (call != null) call.resolve();
    }

    // ----------------------- LEADERBOARDS -----------------------

    @PluginMethod
    public void updatePlayerScore(PluginCall call) {
        String id = call.getString("id");
        Integer score = call.getInt("score");
        if (id == null || score == null) { call.reject("id and score are required"); return; }
        getActivity().runOnUiThread(() -> {
            PlayGames.getLeaderboardsClient(getActivity()).submitScore(id, score);
            call.resolve();
        });
    }

    @PluginMethod
    public void loadPlayerScore(PluginCall call) {
        String id = call.getString("id");
        if (id == null) { call.reject("id is required"); return; }
        getActivity().runOnUiThread(() ->
            PlayGames.getLeaderboardsClient(getActivity())
                .loadCurrentPlayerLeaderboardScore(id,
                    LeaderboardVariant.TIME_SPAN_ALL_TIME,
                    LeaderboardVariant.COLLECTION_PUBLIC)
                .addOnSuccessListener(data -> {
                    LeaderboardScore scoreObj = data.get();
                    JSObject result = new JSObject();
                    result.put("score", scoreObj != null ? scoreObj.getRawScore() : 0);
                    call.resolve(result);
                })
                .addOnFailureListener(e -> call.reject(e.getMessage())));
    }

    @PluginMethod
    public void showLeaderboard(PluginCall call) {
        String id = call.getString("id");
        if (id == null) { call.reject("id is required"); return; }
        getActivity().runOnUiThread(() ->
            PlayGames.getLeaderboardsClient(getActivity())
                .getLeaderboardIntent(id)
                .addOnSuccessListener(intent ->
                    startActivityForResult(call, intent, "leaderboardCallback")));
    }

    @ActivityCallback
    private void leaderboardCallback(PluginCall call, ActivityResult result) {
        if (call != null) call.resolve();
    }

    @PluginMethod
    public void showAllLeaderboards(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            LeaderboardsClient client = PlayGames.getLeaderboardsClient(getActivity());
            client.loadLeaderboardMetadata(true).addOnSuccessListener(data ->
                client.getAllLeaderboardsIntent().addOnSuccessListener(intent -> {
                    if (data.get() != null) data.get().release();
                    startActivityForResult(call, intent, "allLeaderboardsCallback");
                }));
        });
    }

    @ActivityCallback
    private void allLeaderboardsCallback(PluginCall call, ActivityResult result) {
        if (call != null) call.resolve();
    }

    // ----------------------- GAME SAVES -----------------------

    @PluginMethod
    public void showSavedGames(PluginCall call) {
        String title = call.getString("title");
        boolean allowAddButton = Boolean.TRUE.equals(call.getBoolean("allowAddButton", false));
        boolean allowDelete = Boolean.TRUE.equals(call.getBoolean("allowDelete", false));
        int maxSnapshots = call.getInt("maxSnapshots", 5);
        if (title == null) { call.reject("title is required"); return; }
        getActivity().runOnUiThread(() ->
            PlayGames.getSnapshotsClient(getActivity())
                .getSelectSnapshotIntent(title, allowAddButton, allowDelete, maxSnapshots)
                .addOnSuccessListener(intent ->
                    startActivityForResult(call, intent, "savedGamesCallback")));
    }

    @ActivityCallback
    private void savedGamesCallback(PluginCall call, ActivityResult result) {
        if (call == null) return;
        Intent data = result.getData();
        if (data != null) {
            if (data.hasExtra(SnapshotsClient.EXTRA_SNAPSHOT_METADATA)) {
                SnapshotMetadata meta = data.getParcelableExtra(SnapshotsClient.EXTRA_SNAPSHOT_METADATA);
                JSObject payload = new JSObject();
                payload.put("id", meta.getUniqueName());
                notifyListeners("loadSavedGameRequest", payload);
            } else if (data.hasExtra(SnapshotsClient.EXTRA_SNAPSHOT_NEW)) {
                notifyListeners("saveGameRequest", new JSObject());
            }
        }
        call.resolve();
    }

    @PluginMethod
    public void saveGame(PluginCall call) {
        String snapshotName = call.getString("snapshotName");
        String snapshotDescription = call.getString("snapshotDescription");
        JSObject snapshotContents = call.getObject("snapshotContents");
        if (snapshotName == null || snapshotDescription == null || snapshotContents == null) {
            call.reject("snapshotName, snapshotDescription and snapshotContents are required");
            return;
        }
        getActivity().runOnUiThread(() -> {
            SnapshotsClient client = PlayGames.getSnapshotsClient(getActivity());
            client.open(snapshotName, true, SnapshotsClient.RESOLUTION_POLICY_MOST_RECENTLY_MODIFIED)
                .addOnSuccessListener(dataOrConflict -> {
                    if (dataOrConflict.isConflict()) {
                        JSObject payload = new JSObject();
                        payload.put("conflictId", dataOrConflict.getConflict().getConflictId());
                        notifyListeners("saveGameConflict", payload);
                        call.resolve();
                        return;
                    }
                    dataOrConflict.getData().getSnapshotContents()
                        .writeBytes(snapshotContents.toString().getBytes(StandardCharsets.UTF_8));
                    SnapshotMetadataChange change = new SnapshotMetadataChange.Builder()
                        .setDescription(snapshotDescription).build();
                    client.commitAndClose(dataOrConflict.getData(), change);
                    call.resolve();
                })
                .addOnFailureListener(e -> call.reject(e.getMessage()));
        });
    }

    @PluginMethod
    public void loadGameSave(PluginCall call) {
        String snapshotName = call.getString("snapshotName");
        if (snapshotName == null) { call.reject("snapshotName is required"); return; }
        getActivity().runOnUiThread(() ->
            PlayGames.getSnapshotsClient(getActivity())
                .open(snapshotName, true, SnapshotsClient.RESOLUTION_POLICY_MOST_RECENTLY_MODIFIED)
                .addOnFailureListener(e -> call.reject(e.getMessage()))
                .continueWith(task -> {
                    Snapshot snapshot = task.getResult().getData();
                    try {
                        return snapshot.getSnapshotContents().readFully();
                    } catch (IOException e) {
                        call.reject(e.getMessage());
                        return null;
                    }
                })
                .addOnCompleteListener(task ->
                    task.addOnSuccessListener(bytes -> {
                        if (bytes == null) return;
                        try {
                            call.resolve(new JSObject(new String(bytes, StandardCharsets.UTF_8)));
                        } catch (JSONException e) {
                            call.reject(e.getMessage());
                        }
                    })));
    }

    // ----------------------- FRIENDS -----------------------

    @PluginMethod
    public void getFriendsList(PluginCall call) {
        getActivity().runOnUiThread(() ->
            PlayGames.getPlayersClient(getActivity())
                .loadFriends(200, false)
                .addOnSuccessListener(data -> {
                    PlayerBuffer buf = data.get();
                    JSArray players = new JSArray();
                    int total = buf.getCount();
                    if (total == 0) {
                        JSObject result = new JSObject();
                        result.put("friends", players);
                        call.resolve(result);
                        return;
                    }
                    AtomicInteger count = new AtomicInteger();
                    for (int i = 0; i < total; i++) {
                        Player p = buf.get(i);
                        JSObject playerObj = buildPlayerObject(p);
                        if (p.hasIconImage()) {
                            ImageManager mgr = ImageManager.create(getContext());
                            mgr.loadImage((uri, drawable, isRequested) -> {
                                if (isRequested && drawable instanceof BitmapDrawable) {
                                    playerObj.put("iconImageBase64", "data:image/png;base64, " + bitmapToBase64((BitmapDrawable) drawable));
                                }
                                players.put(playerObj);
                                if (count.incrementAndGet() >= total) {
                                    JSObject result = new JSObject();
                                    result.put("friends", players);
                                    call.resolve(result);
                                }
                            }, Objects.requireNonNull(p.getIconImageUri()));
                        } else {
                            players.put(playerObj);
                            if (count.incrementAndGet() >= total) {
                                JSObject result = new JSObject();
                                result.put("friends", players);
                                call.resolve(result);
                            }
                        }
                    }
                })
                .addOnFailureListener(exception -> {
                    if (exception instanceof FriendsResolutionRequiredException) {
                        PendingIntent pending = ((FriendsResolutionRequiredException) exception).getResolution();
                        try {
                            getActivity().startIntentSenderForResult(
                                pending.getIntentSender(), SHOW_SHARING_FRIENDS_CONSENT,
                                null, 0, 0, 0, null);
                            JSObject errData = new JSObject();
                            errData.put("code", ERROR_CODE_HAS_RESOLUTION);
                            errData.put("message", "Waiting for user permission. Listen for 'friendsListRequestSuccessful' event.");
                            call.reject("Waiting for permission", String.valueOf(ERROR_CODE_HAS_RESOLUTION), null, errData);
                        } catch (Exception e) {
                            JSObject errData = new JSObject();
                            errData.put("code", ERROR_CODE_NO_RESOLUTION);
                            errData.put("message", e.getMessage());
                            call.reject(e.getMessage(), String.valueOf(ERROR_CODE_NO_RESOLUTION), null, errData);
                        }
                    } else {
                        call.reject(exception.getMessage());
                    }
                }));
    }

    @Override
    protected void handleOnActivityResult(int requestCode, int resultCode, Intent data) {
        super.handleOnActivityResult(requestCode, resultCode, data);
        if (requestCode == SHOW_SHARING_FRIENDS_CONSENT && resultCode == Activity.RESULT_OK) {
            notifyListeners("friendsListRequestSuccessful", new JSObject());
        }
    }

    // ----------------------- PLAYERS -----------------------

    @PluginMethod
    public void showAnotherPlayersProfile(PluginCall call) {
        String id = call.getString("id");
        if (id == null) { call.reject("id is required"); return; }
        showProfileById(call, id);
    }

    private void showProfileById(@Nullable PluginCall call, String playerId) {
        getActivity().runOnUiThread(() ->
            PlayGames.getPlayersClient(getActivity())
                .getCompareProfileIntent(playerId)
                .addOnSuccessListener(intent -> {
                    if (call != null) {
                        startActivityForResult(call, intent, "profileCallback");
                    } else {
                        getActivity().startActivity(intent);
                    }
                }));
    }

    @ActivityCallback
    private void profileCallback(PluginCall call, ActivityResult result) {
        if (call != null) call.resolve();
    }

    @PluginMethod
    public void showPlayerSearch(PluginCall call) {
        getActivity().runOnUiThread(() ->
            PlayGames.getPlayersClient(getActivity())
                .getPlayerSearchIntent()
                .addOnSuccessListener(intent ->
                    startActivityForResult(call, intent, "playerSearchCallback")));
    }

    @ActivityCallback
    private void playerSearchCallback(PluginCall call, ActivityResult result) {
        if (call == null) return;
        Intent data = result.getData();
        if (data != null && result.getResultCode() == Activity.RESULT_OK) {
            ArrayList<Player> found = data.getParcelableArrayListExtra(PlayersClient.EXTRA_PLAYER_SEARCH_RESULTS);
            if (found != null && !found.isEmpty()) {
                showProfileById(null, found.get(0).getPlayerId());
            }
        }
        call.resolve();
    }

    @PluginMethod
    public void getPlayer(PluginCall call) {
        String id = call.getString("id");
        boolean forceReload = Boolean.TRUE.equals(call.getBoolean("forceReload", false));
        if (id == null) { call.reject("id is required"); return; }
        getActivity().runOnUiThread(() ->
            PlayGames.getPlayersClient(getActivity())
                .loadPlayer(id, forceReload)
                .addOnSuccessListener(data -> {
                    Player p = data.get();
                    if (p == null) { call.resolve(new JSObject()); return; }
                    JSObject result = buildPlayerObject(p);
                    if (p.hasIconImage()) {
                        ImageManager mgr = ImageManager.create(getContext());
                        mgr.loadImage((uri, drawable, isRequested) -> {
                            if (isRequested && drawable instanceof BitmapDrawable) {
                                result.put("iconImageBase64", "data:image/png;base64, " + bitmapToBase64((BitmapDrawable) drawable));
                            }
                            call.resolve(result);
                        }, Objects.requireNonNull(p.getIconImageUri()));
                    } else {
                        call.resolve(result);
                    }
                })
                .addOnFailureListener(e -> call.reject(e.getMessage())));
    }

    @PluginMethod
    public void getCurrentPlayerStats(PluginCall call) {
        PlayGames.getPlayerStatsClient(getActivity())
            .loadPlayerStats(true)
            .addOnCompleteListener(task -> {
                if (!task.isSuccessful()) {
                    String msg = task.getException() != null ? task.getException().getMessage() : "Unknown error";
                    call.reject("Failed to fetch player stats: " + msg);
                    return;
                }
                PlayerStats stats = task.getResult().get();
                if (stats == null) { call.reject("No stats available"); return; }
                JSObject result = new JSObject();
                result.put("averageSessionLength", stats.getAverageSessionLength());
                result.put("daysSinceLastPlayed", stats.getDaysSinceLastPlayed());
                result.put("numberOfPurchases", stats.getNumberOfPurchases());
                result.put("numberOfSessions", stats.getNumberOfSessions());
                result.put("sessionPercentile", stats.getSessionPercentile());
                result.put("spendPercentile", stats.getSpendPercentile());
                call.resolve(result);
            });
    }

    // ----------------------- EVENTS -----------------------

    @PluginMethod
    public void incrementEvent(PluginCall call) {
        String id = call.getString("id");
        Integer amount = call.getInt("amount");
        if (id == null || amount == null) { call.reject("id and amount are required"); return; }
        getActivity().runOnUiThread(() -> {
            PlayGames.getEventsClient(getActivity()).increment(id, amount);
            call.resolve();
        });
    }

    @PluginMethod
    public void getAllEvents(PluginCall call) {
        getActivity().runOnUiThread(() ->
            PlayGames.getEventsClient(getActivity()).load(true)
                .addOnCompleteListener(task -> {
                    if (!task.isSuccessful()) { call.reject("Failed to load events"); return; }
                    JSArray events = new JSArray();
                    int total = task.getResult().get().getCount();
                    if (total == 0) {
                        JSObject result = new JSObject();
                        result.put("events", events);
                        call.resolve(result);
                        return;
                    }
                    AtomicInteger count = new AtomicInteger();
                    for (Event event : task.getResult().get()) {
                        JSObject eventObj = buildEventObject(event);
                        JSObject playerObj = buildPlayerObject(event.getPlayer());
                        if (event.getPlayer().hasIconImage()) {
                            ImageManager mgr = ImageManager.create(getContext());
                            mgr.loadImage((uri, drawable, isRequested) -> {
                                if (isRequested && drawable instanceof BitmapDrawable) {
                                    playerObj.put("iconImageBase64", "data:image/png;base64, " + bitmapToBase64((BitmapDrawable) drawable));
                                }
                                eventObj.put("player", playerObj);
                                events.put(eventObj);
                                if (count.incrementAndGet() >= total) {
                                    JSObject result = new JSObject();
                                    result.put("events", events);
                                    call.resolve(result);
                                }
                            }, Objects.requireNonNull(event.getPlayer().getIconImageUri()));
                        } else {
                            eventObj.put("player", playerObj);
                            events.put(eventObj);
                            if (count.incrementAndGet() >= total) {
                                JSObject result = new JSObject();
                                result.put("events", events);
                                call.resolve(result);
                            }
                        }
                    }
                }));
    }

    @PluginMethod
    public void getEvent(PluginCall call) {
        String id = call.getString("id");
        if (id == null) { call.reject("id is required"); return; }
        getActivity().runOnUiThread(() ->
            PlayGames.getEventsClient(getActivity()).loadByIds(true, id)
                .addOnCompleteListener(task -> {
                    if (!task.isSuccessful()) { call.reject("Failed to load event"); return; }
                    for (Event event : task.getResult().get()) {
                        JSObject eventObj = buildEventObject(event);
                        JSObject playerObj = buildPlayerObject(event.getPlayer());
                        if (event.getPlayer().hasIconImage()) {
                            ImageManager mgr = ImageManager.create(getContext());
                            mgr.loadImage((uri, drawable, isRequested) -> {
                                if (isRequested && drawable instanceof BitmapDrawable) {
                                    playerObj.put("iconImageBase64", "data:image/png;base64, " + bitmapToBase64((BitmapDrawable) drawable));
                                }
                                eventObj.put("player", playerObj);
                                call.resolve(eventObj);
                            }, Objects.requireNonNull(event.getPlayer().getIconImageUri()));
                        } else {
                            eventObj.put("player", playerObj);
                            call.resolve(eventObj);
                        }
                    }
                }));
    }

    // ----------------------- HELPERS -----------------------

    private JSObject buildPlayerObject(Player p) {
        JSObject obj = new JSObject();
        obj.put("id", p.getPlayerId());
        obj.put("name", p.getDisplayName());
        obj.put("title", p.getTitle());
        obj.put("retrievedTimestamp", p.getRetrievedTimestamp());
        if (p.getBannerImageLandscapeUri() != null)
            obj.put("bannerImageLandscapeUri", p.getBannerImageLandscapeUri().toString());
        if (p.getBannerImagePortraitUri() != null)
            obj.put("bannerImagePortraitUri", p.getBannerImagePortraitUri().toString());
        if (p.hasIconImage())
            obj.put("iconImageUri", p.getIconImageUri().toString());
        if (p.hasHiResImage())
            obj.put("hiResImageUri", p.getHiResImageUri().toString());
        if (p.getLevelInfo() != null) {
            JSObject lvl = new JSObject();
            lvl.put("currentLevel", p.getLevelInfo().getCurrentLevel().getLevelNumber());
            lvl.put("maxXp", p.getLevelInfo().getCurrentLevel().getMaxXp());
            lvl.put("minXp", p.getLevelInfo().getCurrentLevel().getMinXp());
            lvl.put("hashCode", p.getLevelInfo().getCurrentLevel().hashCode());
            obj.put("levelInfo", lvl);
        }
        return obj;
    }

    private JSObject buildEventObject(Event event) {
        JSObject obj = new JSObject();
        obj.put("id", event.getEventId());
        obj.put("name", event.getName());
        obj.put("description", event.getDescription());
        if (event.getIconImageUri() != null)
            obj.put("iconImageUri", event.getIconImageUri().toString());
        obj.put("formattedValue", event.getFormattedValue());
        obj.put("value", event.getValue());
        return obj;
    }

    private String bitmapToBase64(BitmapDrawable drawable) {
        Bitmap bitmap = drawable.getBitmap();
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, baos);
        return Base64.encodeToString(baos.toByteArray(), Base64.DEFAULT);
    }
}

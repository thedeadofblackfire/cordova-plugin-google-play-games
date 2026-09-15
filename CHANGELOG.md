# Change Log
All notable changes to this project will be documented in this file.

# Unreleased

#### Added
* `loadAchievements({ forceReload })` / `getAchievement({ id, forceReload })` — read
  achievement type, state and, for incremental ones, `currentSteps` / `totalSteps`.
  Without a read API an incremental achievement could be written but never reconciled.
* `unlocked` in the result of `unlockAchievement` / `incrementAchievement` /
  `setStepsInAchievement` — whether that call is what completed the achievement.
* `immediate` option on the four achievement writes (default `true`).
* `isAuthenticated()` — report whether Play Games has a session, without ever showing UI.
* `login({ interactive })` — `false` rejects with code `SIGN_IN_REQUIRED` instead of
  falling back to the native sign-in prompt. Defaults to `true`, so existing calls are
  unchanged.

#### Changed
* Achievement writes now use the Play Games `*Immediate` API by default, so a failed
  write **rejects** instead of resolving as a success. This is what surfaces the usual
  incremental-achievement trap: calling `increment`/`setSteps` on an id configured as
  *Standard* in the Play Console used to fail silently. Pass `immediate: false` to
  restore the fire-and-forget behaviour.
* `incrementAchievement` rejects a `count < 1`, `setStepsInAchievement` a `count < 0` —
  Play discards them anyway.

#### Fixed
* `showAchievements()` could leave its `PluginCall` unsettled forever (a JS promise
  pending for the rest of the session) when the achievement load or the intent request
  failed — neither had a failure listener. The loaded buffer is now released too.

# Version 1.0.0

#### Added
* Added achievements, leaderboards and game savings. Initial commit.

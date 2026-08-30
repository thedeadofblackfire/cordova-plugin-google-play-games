# Change Log
All notable changes to this project will be documented in this file.

# Unreleased

#### Added
* `isAuthenticated()` — report whether Play Games has a session, without ever showing UI.
* `login({ interactive })` — `false` rejects with code `SIGN_IN_REQUIRED` instead of
  falling back to the native sign-in prompt. Defaults to `true`, so existing calls are
  unchanged.

# Version 1.0.0

#### Added
* Added achievements, leaderboards and game savings. Initial commit.

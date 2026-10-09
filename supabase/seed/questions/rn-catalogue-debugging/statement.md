> **Sample question.** This placeholder ships with CodeArena to demonstrate the format. Replace it before using the template with real candidates.

## Context

You have joined the team that owns the **Catalogue** app, a React Native app our field sales staff use to browse products and keep a list of favourites. The release candidate failed QA. Your job is to find the root causes and fix them in the code provided.

You can't run the app here. Read the code, reason about how React and React Native behave, and change the files directly. Reviewers care most about **correct root causes** and **clear explanations**.

## Bug reports from QA

1. **Search does nothing.** Typing in the search box never changes the list. Only the initial results ever appear.
2. **Out-of-date results.** On a slow network, typing quickly sometimes shows results for an *earlier* search term after the latest one.
3. **Favourites don't stick.** Tapping ♡ doesn't change the icon until the row is scrolled off screen and back. After restarting the app, favourites that were removed sometimes come back.
4. **Wrong placeholder images.** After the list is filtered, some rows show a grey "image failed" placeholder even though their image loads fine. Rows that genuinely failed sometimes show another product's image.
5. **Release build fails.** The Android release build fails with `Unable to resolve module @react-native-async-storage/async-storage`.

## What to do

- Fix each problem in the files on the left. `src/api/catalogue.ts` is read-only and works as documented.
- Keep the existing architecture: hooks, `FlatList`, and AsyncStorage for persistence. Don't add new libraries, apart from fixing `package.json`.
- In **Explain your fix**, list each root cause and how your change addresses it. A few precise sentences per bug are enough.

## Hints

- Compare what each `useEffect` and `useCallback` *reads* with what it *declares* it depends on.
- `fetchProducts` accepts an `AbortSignal`.
- React compares state by reference.

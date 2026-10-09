-- ════════════════════════════════════════════════════════════════════════════
-- GENERATED FILE: do not edit. Built by `npm run seed:build` from
-- supabase/seed/questions/* and supabase/seed/templates/*.
-- Safe to re-run: rows that already exist are left untouched.
-- ════════════════════════════════════════════════════════════════════════════
begin;

-- Question: placeholder-question-3
insert into public.questions (id, slug, title, category, role_tags, skill_tags, difficulty, time_suggestion_minutes, statement_md, is_sample, status) values (
  '1ddcb8b2-aade-4a1f-a449-f31014cceaf7', 'placeholder-question-3', '[SAMPLE] Placeholder question 3', 'Placeholder', array['lead-react-native-developer']::text[], array['placeholder']::text[], 'medium', 35,
  '> **Placeholder.** Zycus will add this question later. A Super Admin can replace it in **Admin → Question bank** or by importing a question JSON file.

## Question 3

This slot is reserved for the third hands-on task of the *Lead React Native Developer – Hands-On* assessment.

If you see this text during a real assessment, tell the Zycus Talent Acquisition team in your **Explain your fix** notes and continue with the other questions.
',
  true, 'published'
) on conflict (id) do nothing;
insert into public.question_files (question_id, path, language, content, readonly, sort_order) values
  ('1ddcb8b2-aade-4a1f-a449-f31014cceaf7', 'README.md', 'markdown', '# Placeholder question 3

Starter files for the real question will appear here.
', false, 0),
  ('1ddcb8b2-aade-4a1f-a449-f31014cceaf7', 'src/index.ts', 'typescript', '// Placeholder starter file. Replace with the real question''s code.
export function placeholder(): string {
  return ''Question 3 is coming soon'';
}
', false, 1)
on conflict (question_id, path) do nothing;
insert into public.question_rubric_items (question_id, key, criterion, description, max_points, sort_order) values
  ('1ddcb8b2-aade-4a1f-a449-f31014cceaf7', 'correctness', 'Correctness', 'Replace with real criteria.', 10, 0),
  ('1ddcb8b2-aade-4a1f-a449-f31014cceaf7', 'explanation', 'Explanation', 'Replace with real criteria.', 5, 1)
on conflict (question_id, key) do nothing;
insert into public.question_solutions (question_id, notes_md, files) values (
  '1ddcb8b2-aade-4a1f-a449-f31014cceaf7', 'Placeholder: add the reference solution for the real question here.', '[]'::jsonb
) on conflict (question_id) do nothing;

-- Question: placeholder-question-4
insert into public.questions (id, slug, title, category, role_tags, skill_tags, difficulty, time_suggestion_minutes, statement_md, is_sample, status) values (
  'ad17df1c-902d-4b7f-9054-8f0bec4873e2', 'placeholder-question-4', '[SAMPLE] Placeholder question 4', 'Placeholder', array['lead-react-native-developer']::text[], array['placeholder']::text[], 'medium', 35,
  '> **Placeholder.** Zycus will add this question later. A Super Admin can replace it in **Admin → Question bank** or by importing a question JSON file.

## Question 4

This slot is reserved for the fourth hands-on task of the *Lead React Native Developer – Hands-On* assessment.

If you see this text during a real assessment, tell the Zycus Talent Acquisition team in your **Explain your fix** notes and continue with the other questions.
',
  true, 'published'
) on conflict (id) do nothing;
insert into public.question_files (question_id, path, language, content, readonly, sort_order) values
  ('ad17df1c-902d-4b7f-9054-8f0bec4873e2', 'README.md', 'markdown', '# Placeholder question 4

Starter files for the real question will appear here.
', false, 0),
  ('ad17df1c-902d-4b7f-9054-8f0bec4873e2', 'src/main.ts', 'typescript', '// Placeholder starter file. Replace with the real question''s code.
export function main(): string {
  return ''Question 4 is coming soon'';
}
', false, 1)
on conflict (question_id, path) do nothing;
insert into public.question_rubric_items (question_id, key, criterion, description, max_points, sort_order) values
  ('ad17df1c-902d-4b7f-9054-8f0bec4873e2', 'correctness', 'Correctness', 'Replace with real criteria.', 10, 0),
  ('ad17df1c-902d-4b7f-9054-8f0bec4873e2', 'explanation', 'Explanation', 'Replace with real criteria.', 5, 1)
on conflict (question_id, key) do nothing;
insert into public.question_solutions (question_id, notes_md, files) values (
  'ad17df1c-902d-4b7f-9054-8f0bec4873e2', 'Placeholder: add the reference solution for the real question here.', '[]'::jsonb
) on conflict (question_id) do nothing;

-- Question: rn-catalogue-debugging
insert into public.questions (id, slug, title, category, role_tags, skill_tags, difficulty, time_suggestion_minutes, statement_md, is_sample, status) values (
  'f50a2b49-3263-4569-bd97-ff8835a45436', 'rn-catalogue-debugging', '[SAMPLE] Fix the product catalogue screen (React Native)', 'React Native debugging', array['lead-react-native-developer', 'react-native-developer']::text[], array['react-native', 'react-hooks', 'flatlist', 'state-management', 'async']::text[], 'medium', 40,
  '> **Sample question.** This placeholder ships with CodeArena to demonstrate the format. Replace it before using the template with real candidates.

## Context

You have joined the team that owns the **Catalogue** app, a React Native app our field sales staff use to browse products and keep a list of favourites. The release candidate failed QA. Your job is to find the root causes and fix them in the code provided.

You can''t run the app here. Read the code, reason about how React and React Native behave, and change the files directly. Reviewers care most about **correct root causes** and **clear explanations**.

## Bug reports from QA

1. **Search does nothing.** Typing in the search box never changes the list. Only the initial results ever appear.
2. **Out-of-date results.** On a slow network, typing quickly sometimes shows results for an *earlier* search term after the latest one.
3. **Favourites don''t stick.** Tapping ♡ doesn''t change the icon until the row is scrolled off screen and back. After restarting the app, favourites that were removed sometimes come back.
4. **Wrong placeholder images.** After the list is filtered, some rows show a grey "image failed" placeholder even though their image loads fine. Rows that genuinely failed sometimes show another product''s image.
5. **Release build fails.** The Android release build fails with `Unable to resolve module @react-native-async-storage/async-storage`.

## What to do

- Fix each problem in the files on the left. `src/api/catalogue.ts` is read-only and works as documented.
- Keep the existing architecture: hooks, `FlatList`, and AsyncStorage for persistence. Don''t add new libraries, apart from fixing `package.json`.
- In **Explain your fix**, list each root cause and how your change addresses it. A few precise sentences per bug are enough.

## Hints

- Compare what each `useEffect` and `useCallback` *reads* with what it *declares* it depends on.
- `fetchProducts` accepts an `AbortSignal`.
- React compares state by reference.
',
  true, 'published'
) on conflict (id) do nothing;
insert into public.question_files (question_id, path, language, content, readonly, sort_order) values
  ('f50a2b49-3263-4569-bd97-ff8835a45436', 'App.tsx', 'typescript', 'import React from ''react'';
import { SafeAreaView, StatusBar, StyleSheet } from ''react-native'';
import { ProductListScreen } from ''./src/screens/ProductListScreen'';

export default function App() {
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <ProductListScreen onOpenProduct={(id) => console.log(''open product'', id)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ''#F7F9FC'' },
});
', false, 0),
  ('f50a2b49-3263-4569-bd97-ff8835a45436', 'src/screens/ProductListScreen.tsx', 'typescript', 'import React, { useCallback, useEffect, useState } from ''react'';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, View } from ''react-native'';
import AsyncStorage from ''@react-native-async-storage/async-storage'';
import { useProducts } from ''../hooks/useProducts'';
import { ProductRow } from ''../components/ProductRow'';

const FAVOURITES_KEY = ''catalogue:favourites'';

interface Props {
  onOpenProduct: (productId: string) => void;
}

export function ProductListScreen({ onOpenProduct }: Props) {
  const [query, setQuery] = useState('''');
  const [favourites, setFavourites] = useState<string[]>([]);
  const { products, loading, error } = useProducts(query);

  useEffect(() => {
    AsyncStorage.getItem(FAVOURITES_KEY).then((raw) => {
      if (raw) setFavourites(JSON.parse(raw));
    });
  }, []);

  const toggleFavourite = useCallback((productId: string) => {
    const index = favourites.indexOf(productId);
    if (index >= 0) {
      favourites.splice(index, 1);
    } else {
      favourites.push(productId);
    }
    setFavourites(favourites);
    AsyncStorage.setItem(FAVOURITES_KEY, JSON.stringify(favourites));
  }, []);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Search products"
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
        clearButtonMode="while-editing"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={products}
        keyExtractor={(_, index) => String(index)}
        renderItem={({ item }) => (
          <ProductRow
            product={item}
            isFavourite={favourites.includes(item.id)}
            onToggleFavourite={toggleFavourite}
            onPress={() => onOpenProduct(item.id)}
          />
        )}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No products found</Text> : null}
        ListFooterComponent={loading ? <ActivityIndicator style={styles.spinner} /> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  search: {
    height: 44,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ''#CBD5E1'',
    backgroundColor: ''#FFFFFF'',
  },
  error: { color: ''#B42318'', marginBottom: 8 },
  empty: { textAlign: ''center'', color: ''#526670'', marginTop: 32 },
  spinner: { marginVertical: 16 },
});
', false, 1),
  ('f50a2b49-3263-4569-bd97-ff8835a45436', 'src/hooks/useProducts.ts', 'typescript', 'import { useEffect, useState } from ''react'';
import { fetchProducts, type Product } from ''../api/catalogue'';

export function useProducts(query: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchProducts(query)
      .then((items) => {
        setProducts(items);
      })
      .catch((e: Error) => {
        setError(e.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return { products, loading, error };
}
', false, 2),
  ('f50a2b49-3263-4569-bd97-ff8835a45436', 'src/components/ProductRow.tsx', 'typescript', 'import React, { memo, useState } from ''react'';
import { Image, Pressable, StyleSheet, Text, View } from ''react-native'';
import type { Product } from ''../api/catalogue'';

interface Props {
  product: Product;
  isFavourite: boolean;
  onToggleFavourite: (productId: string) => void;
  onPress: () => void;
}

export const ProductRow = memo(function ProductRow({ product, isFavourite, onToggleFavourite, onPress }: Props) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <Pressable style={styles.row} onPress={onPress} accessibilityRole="button" accessibilityLabel={product.name}>
      {imageFailed ? (
        <View style={[styles.image, styles.placeholder]} />
      ) : (
        <Image source={{ uri: product.imageUrl }} style={styles.image} onError={() => setImageFailed(true)} />
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {product.name}
        </Text>
        <Text style={styles.price}>{formatPrice(product.priceMinor, product.currency)}</Text>
      </View>
      <Pressable
        onPress={() => onToggleFavourite(product.id)}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={isFavourite ? ''Remove from favourites'' : ''Add to favourites''}
      >
        <Text style={styles.heart}>{isFavourite ? ''♥'' : ''♡''}</Text>
      </Pressable>
    </Pressable>
  );
});

function formatPrice(minorUnits: number, currency: string) {
  return `${currency} ${(minorUnits / 100).toFixed(2)}`;
}

const styles = StyleSheet.create({
  row: { flexDirection: ''row'', alignItems: ''center'', paddingVertical: 12, gap: 12 },
  image: { width: 56, height: 56, borderRadius: 8 },
  placeholder: { backgroundColor: ''#E2E8F0'' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: ''600'', color: ''#0B1F3F'' },
  price: { marginTop: 2, color: ''#526670'' },
  heart: { fontSize: 22, color: ''#0036B0'' },
});
', false, 3),
  ('f50a2b49-3263-4569-bd97-ff8835a45436', 'src/api/catalogue.ts', 'typescript', '// Read-only: provided by the platform team. Works as documented.

export interface Product {
  id: string;
  name: string;
  /** Price in minor units (paise / cents). */
  priceMinor: number;
  currency: string;
  imageUrl: string;
}

const BASE_URL = ''https://catalogue.api.example.internal/v2'';

/**
 * Searches the catalogue. An empty query returns the featured products.
 * Pass an AbortSignal to cancel an in-flight request; a cancelled request rejects with an
 * `AbortError` (error.name === ''AbortError'').
 */
export async function fetchProducts(query: string, signal?: AbortSignal): Promise<Product[]> {
  const response = await fetch(`${BASE_URL}/products?q=${encodeURIComponent(query)}`, { signal });
  if (!response.ok) {
    throw new Error(`Catalogue request failed (${response.status})`);
  }
  return (await response.json()) as Product[];
}
', true, 4),
  ('f50a2b49-3263-4569-bd97-ff8835a45436', 'package.json', 'json', '{
  "name": "catalogue",
  "version": "1.4.0",
  "private": true,
  "scripts": {
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "start": "react-native start",
    "lint": "eslint .",
    "test": "jest"
  },
  "dependencies": {
    "react": "19.1.0",
    "react-native": "0.81.4"
  },
  "devDependencies": {
    "@babel/core": "^7.25.2",
    "@react-native/babel-preset": "0.81.4",
    "@react-native/eslint-config": "0.81.4",
    "@react-native/metro-config": "0.81.4",
    "@react-native/typescript-config": "0.81.4",
    "@types/react": "^19.1.0",
    "eslint": "^8.57.0",
    "jest": "^29.6.3",
    "typescript": "^5.8.3"
  },
  "engines": {
    "node": ">=20"
  }
}
', false, 5)
on conflict (question_id, path) do nothing;
insert into public.question_rubric_items (question_id, key, criterion, description, max_points, sort_order) values
  ('f50a2b49-3263-4569-bd97-ff8835a45436', 'search_refetch', 'Search refetches when the query changes', 'Effect depends on `query`; typing a search updates the list without pull-to-refresh.', 5, 0),
  ('f50a2b49-3263-4569-bd97-ff8835a45436', 'race_condition', 'Out-of-order responses can''t overwrite newer results', 'Uses AbortController (the API accepts a signal) or an ignore flag in the effect cleanup; resets error/loading correctly.', 5, 1),
  ('f50a2b49-3263-4569-bd97-ff8835a45436', 'immutable_state', 'Favourites update immutably and persist the right value', 'Functional setState with a new array; no stale closure; persisted value matches state.', 5, 2),
  ('f50a2b49-3263-4569-bd97-ff8835a45436', 'stable_keys', 'List items use stable keys', 'keyExtractor uses product.id; candidate explains why index keys leak row state (image placeholder) after filtering.', 4, 3),
  ('f50a2b49-3263-4569-bd97-ff8835a45436', 'dependency', 'Release build dependency fixed', 'Adds @react-native-async-storage/async-storage to `dependencies` (not devDependencies).', 3, 4),
  ('f50a2b49-3263-4569-bd97-ff8835a45436', 'explanation', 'Quality of the root-cause explanation', 'Notes identify each root cause, the fix and any trade-offs clearly and concisely.', 3, 5)
on conflict (question_id, key) do nothing;
insert into public.question_solutions (question_id, notes_md, files) values (
  'f50a2b49-3263-4569-bd97-ff8835a45436', '## Reference solution (reviewers only)

| # | Symptom | Root cause | Fix |
|---|---|---|---|
| 1 | Search does nothing | `useEffect` in `useProducts` has an empty dependency array, so it runs only on mount and never sees new `query` values | Depend on `[query]` |
| 2 | Out-of-date results | Each keystroke starts a request and *every* response calls `setProducts`. A slow response for an older query can resolve last and overwrite newer results | Create an `AbortController` per effect run, pass `signal` to `fetchProducts`, `abort()` in the cleanup, and ignore `AbortError`. An `ignore` flag set in the cleanup is also acceptable. Clear `error` when a new request starts |
| 3 | Favourites don''t stick | `toggleFavourite` mutates the state array in place (`splice`/`push`) and passes the **same reference** to `setFavourites`, so React bails out of the render. The `useCallback([])` also closes over the *initial* array, so later toggles and the persisted value use stale data | Use a functional update that returns a **new** array, and persist that value. Keep `useCallback` with no stale reads |
| 4 | Wrong placeholder images | `keyExtractor` uses the index. After filtering, `FlatList` reuses the component at each position, so `ProductRow`''s local `imageFailed` state "moves" to a different product | `keyExtractor={(item) => item.id}` |
| 5 | Release build fails | `@react-native-async-storage/async-storage` is imported but not declared in `package.json` (it only worked locally because it was installed by hand) | Add it to `dependencies`, not `devDependencies`. Native modules must be in the app''s dependencies for autolinking |

**Acceptable variants:**
- Persisting in a separate `useEffect` keyed on `favourites`, guarded so the empty initial state doesn''t overwrite storage before hydration, is equally good. The reference calls `setItem` inside the updater, which is idempotent, so a double invocation in StrictMode is harmless.

**Good signs in a candidate''s answer:**
- Explains *why* mutation prevents a re-render (reference equality), not just "use spread".
- Mentions that the persisted value must come from the same next-state, not from a separate read.
- Notes that `memo(ProductRow)` is fine once keys are stable, and that `toggleFavourite` should stay referentially stable.
- Bonus: debounce the search (300 ms). Not required.

**Red flags:**
- Adding `favourites` to the `useCallback` deps but still mutating the array.
- Using `Math.random()` or `Date.now()` as keys.
- Removing `memo` or the AsyncStorage persistence to make symptoms disappear.
', '[{"path":"src/hooks/useProducts.ts","content":"import { useEffect, useState } from ''react'';\nimport { fetchProducts, type Product } from ''../api/catalogue'';\n\nexport function useProducts(query: string) {\n  const [products, setProducts] = useState<Product[]>([]);\n  const [loading, setLoading] = useState(false);\n  const [error, setError] = useState<string | null>(null);\n\n  useEffect(() => {\n    const controller = new AbortController();\n    setLoading(true);\n    setError(null);\n\n    fetchProducts(query, controller.signal)\n      .then((items) => {\n        setProducts(items);\n      })\n      .catch((e: Error) => {\n        if (e.name === ''AbortError'') return; // superseded by a newer query\n        setError(e.message);\n      })\n      .finally(() => {\n        if (!controller.signal.aborted) setLoading(false);\n      });\n\n    return () => controller.abort();\n  }, [query]);\n\n  return { products, loading, error };\n}\n"},{"path":"src/screens/ProductListScreen.tsx","content":"import React, { useCallback, useEffect, useState } from ''react'';\nimport { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, View } from ''react-native'';\nimport AsyncStorage from ''@react-native-async-storage/async-storage'';\nimport { useProducts } from ''../hooks/useProducts'';\nimport { ProductRow } from ''../components/ProductRow'';\n\nconst FAVOURITES_KEY = ''catalogue:favourites'';\n\ninterface Props {\n  onOpenProduct: (productId: string) => void;\n}\n\nexport function ProductListScreen({ onOpenProduct }: Props) {\n  const [query, setQuery] = useState('''');\n  const [favourites, setFavourites] = useState<string[]>([]);\n  const { products, loading, error } = useProducts(query);\n\n  useEffect(() => {\n    AsyncStorage.getItem(FAVOURITES_KEY).then((raw) => {\n      if (raw) setFavourites(JSON.parse(raw));\n    });\n  }, []);\n\n  const toggleFavourite = useCallback((productId: string) => {\n    setFavourites((current) => {\n      const next = current.includes(productId)\n        ? current.filter((id) => id !== productId)\n        : [...current, productId];\n      AsyncStorage.setItem(FAVOURITES_KEY, JSON.stringify(next));\n      return next;\n    });\n  }, []);\n\n  return (\n    <View style={styles.container}>\n      <TextInput\n        style={styles.search}\n        placeholder=\"Search products\"\n        value={query}\n        onChangeText={setQuery}\n        autoCorrect={false}\n        clearButtonMode=\"while-editing\"\n      />\n      {error ? <Text style={styles.error}>{error}</Text> : null}\n      <FlatList\n        data={products}\n        keyExtractor={(item) => item.id}\n        renderItem={({ item }) => (\n          <ProductRow\n            product={item}\n            isFavourite={favourites.includes(item.id)}\n            onToggleFavourite={toggleFavourite}\n            onPress={() => onOpenProduct(item.id)}\n          />\n        )}\n        ListEmptyComponent={!loading ? <Text style={styles.empty}>No products found</Text> : null}\n        ListFooterComponent={loading ? <ActivityIndicator style={styles.spinner} /> : null}\n      />\n    </View>\n  );\n}\n\nconst styles = StyleSheet.create({\n  container: { flex: 1, paddingHorizontal: 16 },\n  search: {\n    height: 44,\n    marginVertical: 12,\n    paddingHorizontal: 12,\n    borderRadius: 8,\n    borderWidth: 1,\n    borderColor: ''#CBD5E1'',\n    backgroundColor: ''#FFFFFF'',\n  },\n  error: { color: ''#B42318'', marginBottom: 8 },\n  empty: { textAlign: ''center'', color: ''#526670'', marginTop: 32 },\n  spinner: { marginVertical: 16 },\n});\n"},{"path":"package.json","content":"{\n  \"name\": \"catalogue\",\n  \"version\": \"1.4.0\",\n  \"private\": true,\n  \"scripts\": {\n    \"android\": \"react-native run-android\",\n    \"ios\": \"react-native run-ios\",\n    \"start\": \"react-native start\",\n    \"lint\": \"eslint .\",\n    \"test\": \"jest\"\n  },\n  \"dependencies\": {\n    \"@react-native-async-storage/async-storage\": \"^2.2.0\",\n    \"react\": \"19.1.0\",\n    \"react-native\": \"0.81.4\"\n  },\n  \"devDependencies\": {\n    \"@babel/core\": \"^7.25.2\",\n    \"@react-native/babel-preset\": \"0.81.4\",\n    \"@react-native/eslint-config\": \"0.81.4\",\n    \"@react-native/metro-config\": \"0.81.4\",\n    \"@react-native/typescript-config\": \"0.81.4\",\n    \"@types/react\": \"^19.1.0\",\n    \"eslint\": \"^8.57.0\",\n    \"jest\": \"^29.6.3\",\n    \"typescript\": \"^5.8.3\"\n  },\n  \"engines\": {\n    \"node\": \">=20\"\n  }\n}\n"}]'::jsonb
) on conflict (question_id) do nothing;

-- Question: spring-orders-debugging
insert into public.questions (id, slug, title, category, role_tags, skill_tags, difficulty, time_suggestion_minutes, statement_md, is_sample, status) values (
  'c32fe8c1-9276-4190-9b2c-3c9b6509809f', 'spring-orders-debugging', '[SAMPLE] Fix the orders service (Spring Boot)', 'Spring Boot debugging', array['lead-react-native-developer', 'full-stack-developer', 'java-developer']::text[], array['spring-boot', 'spring-data-jpa', 'transactions', 'rest', 'bean-validation']::text[], 'medium', 40,
  '> **Sample question.** This placeholder ships with CodeArena to demonstrate the format. Replace it before using the template with real candidates.

## Context

The mobile app places purchase orders through the **orders-service**, a Spring Boot 3 application backed by an in-memory H2 database in development. After the last merge, several problems appeared. Find the root causes and fix them.

You can''t build or run the service here. Read the code, reason about how Spring behaves, and change the files directly.

## Bug reports

1. **Service won''t start.** Since the last merge, the service fails to start locally and in CI.
2. **GET returns 500.** `GET /api/orders/{id}` returns HTTP 500 for an order that exists.
3. **Wrong status for unknown ids.** `GET /api/orders/{id}` for an unknown id returns 500. The API contract requires **404** with a problem-details body.
4. **No validation.** `POST /api/orders` accepts `{"customerEmail": "", "sku": "", "quantity": 0}`. The request DTO is annotated with constraints, but they are ignored.
5. **Partial writes.** When the inventory reservation fails (HTTP 409 is returned correctly), a `NEW` order is still left in the database. Orders whose reservation *succeeds* stay in status `NEW` instead of `RESERVED`.

## What to do

- Fix each problem. Files marked read-only are correct as written.
- Use standard Spring Boot mechanisms. Don''t add third-party libraries beyond Spring Boot starters.
- In **Explain your fix**, give the root cause and your change for each report.

## Hints

- `ApiExceptionHandler` already maps some exceptions to HTTP statuses.
- Think about *how* Spring applies `@Transactional`.
',
  true, 'published'
) on conflict (id) do nothing;
insert into public.question_files (question_id, path, language, content, readonly, sort_order) values
  ('c32fe8c1-9276-4190-9b2c-3c9b6509809f', 'pom.xml', 'xml', '<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>

  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.5.6</version>
    <relativePath/>
  </parent>

  <groupId>com.zycus</groupId>
  <artifactId>orders-service</artifactId>
  <version>1.8.0</version>
  <name>orders-service</name>

  <properties>
    <java.version>21</java.version>
  </properties>

  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <!-- Added for the @NotBlank / @Positive annotations on request DTOs -->
    <dependency>
      <groupId>jakarta.validation</groupId>
      <artifactId>jakarta.validation-api</artifactId>
    </dependency>
    <dependency>
      <groupId>com.h2database</groupId>
      <artifactId>h2</artifactId>
      <scope>runtime</scope>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-test</artifactId>
      <scope>test</scope>
    </dependency>
  </dependencies>

  <build>
    <plugins>
      <plugin>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-maven-plugin</artifactId>
      </plugin>
    </plugins>
  </build>
</project>
', false, 0),
  ('c32fe8c1-9276-4190-9b2c-3c9b6509809f', 'src/main/resources/application.properties', 'properties', 'spring.application.name=orders-service
server.port=8080

# In-memory database for local development and CI
spring.datasource.url=jdbc:h2:mem:orders;DB_CLOSE_DELAY=-1
spring.datasource.username=sa
spring.datasource.password=

spring.jpa.hibernate.ddl-auto=validate
spring.jpa.open-in-view=false

# RFC 9457 problem-details responses for errors
spring.mvc.problemdetails.enabled=true

inventory.base-url=http://localhost:8090
inventory.timeout=2s
', false, 1),
  ('c32fe8c1-9276-4190-9b2c-3c9b6509809f', 'src/main/java/com/zycus/orders/web/OrderController.java', 'java', 'package com.zycus.orders.web;

import com.zycus.orders.service.OrderService;
import com.zycus.orders.web.dto.CreateOrderRequest;
import com.zycus.orders.web.dto.OrderResponse;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<OrderResponse> create(@Valid @RequestBody CreateOrderRequest request) {
        OrderResponse created = orderService.placeOrder(request);
        return ResponseEntity.created(URI.create("/api/orders/" + created.id())).body(created);
    }

    @GetMapping("/{orderId}")
    public OrderResponse get(@PathVariable Long id) {
        return orderService.getOrder(id);
    }

    @GetMapping
    public List<OrderResponse> listForCustomer(@RequestParam String customerEmail) {
        return orderService.ordersForCustomer(customerEmail);
    }
}
', false, 2),
  ('c32fe8c1-9276-4190-9b2c-3c9b6509809f', 'src/main/java/com/zycus/orders/service/OrderService.java', 'java', 'package com.zycus.orders.service;

import com.zycus.orders.domain.PurchaseOrder;
import com.zycus.orders.inventory.InventoryClient;
import com.zycus.orders.repository.OrderRepository;
import com.zycus.orders.web.dto.CreateOrderRequest;
import com.zycus.orders.web.dto.OrderResponse;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final InventoryClient inventoryClient;

    public OrderService(OrderRepository orderRepository, InventoryClient inventoryClient) {
        this.orderRepository = orderRepository;
        this.inventoryClient = inventoryClient;
    }

    public OrderResponse placeOrder(CreateOrderRequest request) {
        PurchaseOrder order = saveAndReserve(request);
        return OrderResponse.from(order);
    }

    @Transactional
    private PurchaseOrder saveAndReserve(CreateOrderRequest request) {
        PurchaseOrder order = orderRepository.save(
                new PurchaseOrder(request.customerEmail(), request.sku(), request.quantity()));
        // Throws InsufficientStockException (mapped to 409) when stock is not available.
        inventoryClient.reserve(request.sku(), request.quantity());
        order.markReserved();
        return order;
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrder(Long id) {
        return OrderResponse.from(orderRepository.findById(id).get());
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> ordersForCustomer(String customerEmail) {
        return orderRepository.findByCustomerEmailOrderByCreatedAtDesc(customerEmail).stream()
                .map(OrderResponse::from)
                .toList();
    }
}
', false, 3),
  ('c32fe8c1-9276-4190-9b2c-3c9b6509809f', 'src/main/java/com/zycus/orders/repository/OrderRepository.java', 'java', 'package com.zycus.orders.repository;

import com.zycus.orders.domain.PurchaseOrder;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<PurchaseOrder, Long> {

    List<PurchaseOrder> findByCustomerEmailOrderByCreatedAtDesc(String customerEmail);
}
', false, 4),
  ('c32fe8c1-9276-4190-9b2c-3c9b6509809f', 'src/main/java/com/zycus/orders/domain/PurchaseOrder.java', 'java', 'package com.zycus.orders.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

// Read-only.
@Entity
@Table(name = "purchase_orders")
public class PurchaseOrder {

    public enum Status { NEW, RESERVED, CANCELLED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String customerEmail;

    @Column(nullable = false)
    private String sku;

    @Column(nullable = false)
    private int quantity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.NEW;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected PurchaseOrder() {
        // for JPA
    }

    public PurchaseOrder(String customerEmail, String sku, int quantity) {
        this.customerEmail = customerEmail;
        this.sku = sku;
        this.quantity = quantity;
    }

    public void markReserved() {
        this.status = Status.RESERVED;
    }

    public Long getId() { return id; }
    public String getCustomerEmail() { return customerEmail; }
    public String getSku() { return sku; }
    public int getQuantity() { return quantity; }
    public Status getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
}
', true, 5),
  ('c32fe8c1-9276-4190-9b2c-3c9b6509809f', 'src/main/java/com/zycus/orders/web/dto/CreateOrderRequest.java', 'java', 'package com.zycus.orders.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

// Read-only.
public record CreateOrderRequest(
        @NotBlank @Email String customerEmail,
        @NotBlank String sku,
        @Positive int quantity) {
}
', true, 6),
  ('c32fe8c1-9276-4190-9b2c-3c9b6509809f', 'src/main/java/com/zycus/orders/web/dto/OrderResponse.java', 'java', 'package com.zycus.orders.web.dto;

import com.zycus.orders.domain.PurchaseOrder;
import java.time.Instant;

// Read-only.
public record OrderResponse(Long id, String customerEmail, String sku, int quantity, String status, Instant createdAt) {

    public static OrderResponse from(PurchaseOrder order) {
        return new OrderResponse(
                order.getId(),
                order.getCustomerEmail(),
                order.getSku(),
                order.getQuantity(),
                order.getStatus().name(),
                order.getCreatedAt());
    }
}
', true, 7),
  ('c32fe8c1-9276-4190-9b2c-3c9b6509809f', 'src/main/java/com/zycus/orders/web/ApiExceptionHandler.java', 'java', 'package com.zycus.orders.web;

import com.zycus.orders.inventory.InventoryClient.InsufficientStockException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

// Read-only.
@RestControllerAdvice
public class ApiExceptionHandler {

    /** Thrown by the service layer when an order id does not exist. */
    public static class OrderNotFoundException extends RuntimeException {
        public OrderNotFoundException(Long id) {
            super("Order " + id + " was not found");
        }
    }

    @ExceptionHandler(OrderNotFoundException.class)
    ProblemDetail handleNotFound(OrderNotFoundException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(InsufficientStockException.class)
    ProblemDetail handleInsufficientStock(InsufficientStockException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
    }
}
', true, 8),
  ('c32fe8c1-9276-4190-9b2c-3c9b6509809f', 'src/main/java/com/zycus/orders/inventory/InventoryClient.java', 'java', 'package com.zycus.orders.inventory;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

// Read-only: works as documented.
@Component
public class InventoryClient {

    public static class InsufficientStockException extends RuntimeException {
        public InsufficientStockException(String sku, int quantity) {
            super("Insufficient stock for " + sku + " (requested " + quantity + ")");
        }
    }

    private final RestClient restClient;

    public InventoryClient(RestClient.Builder builder, @Value("${inventory.base-url}") String baseUrl) {
        this.restClient = builder.baseUrl(baseUrl).build();
    }

    /** Reserves stock or throws {@link InsufficientStockException} when the inventory service returns 409. */
    public void reserve(String sku, int quantity) {
        try {
            restClient.post()
                    .uri("/api/reservations")
                    .body(new ReservationRequest(sku, quantity))
                    .retrieve()
                    .toBodilessEntity();
        } catch (HttpClientErrorException.Conflict e) {
            throw new InsufficientStockException(sku, quantity);
        }
    }

    record ReservationRequest(String sku, int quantity) {}
}
', true, 9)
on conflict (question_id, path) do nothing;
insert into public.question_rubric_items (question_id, key, criterion, description, max_points, sort_order) values
  ('c32fe8c1-9276-4190-9b2c-3c9b6509809f', 'startup', 'Service starts again', 'Identifies that `ddl-auto=validate` fails against an empty in-memory database; uses create-drop for this profile or adds a schema (Flyway/schema.sql) and explains the choice.', 4, 0),
  ('c32fe8c1-9276-4190-9b2c-3c9b6509809f', 'path_variable', 'GET by id works', 'Path variable name matches the URI template (`@PathVariable("orderId") Long id` or rename).', 4, 1),
  ('c32fe8c1-9276-4190-9b2c-3c9b6509809f', 'not_found', 'Unknown order returns 404', 'Replaces `Optional.get()` with `orElseThrow(() -> new OrderNotFoundException(id))` so the existing handler returns 404.', 5, 2),
  ('c32fe8c1-9276-4190-9b2c-3c9b6509809f', 'validation', 'Invalid requests are rejected with 400', 'Replaces the bare jakarta.validation-api with spring-boot-starter-validation (provides Hibernate Validator) and explains why annotations were silently ignored.', 5, 3),
  ('c32fe8c1-9276-4190-9b2c-3c9b6509809f', 'transaction', 'Order placement is atomic', 'Explains proxy-based @Transactional: private and self-invoked methods are not intercepted. Makes the public method transactional (or moves logic to another bean) so failed reservations roll back and status changes are flushed.', 5, 4),
  ('c32fe8c1-9276-4190-9b2c-3c9b6509809f', 'explanation', 'Quality of the root-cause explanation', 'Clear, correct reasoning for each change; mentions how they''d test it.', 2, 5)
on conflict (question_id, key) do nothing;
insert into public.question_solutions (question_id, notes_md, files) values (
  'c32fe8c1-9276-4190-9b2c-3c9b6509809f', '## Reference solution (reviewers only)

| # | Symptom | Root cause | Fix |
|---|---|---|---|
| 1 | Service won''t start | `spring.jpa.hibernate.ddl-auto=validate` checks the schema against the entities, but the in-memory H2 database is empty, so it fails with *Schema-validation: missing table [purchase_orders]* | For the dev/CI in-memory DB, use `create-drop`. Alternatively, add a schema (`schema.sql`, or Flyway with `validate`). Strong answers note that production should use migrations plus `validate`, never `update` |
| 2 | GET returns 500 for an existing order | The URI template variable is `{orderId}`, but the parameter is bound by name as `id`, so Spring throws `MissingPathVariableException` (500) | `@PathVariable("orderId") Long id`, or rename one side so they match |
| 3 | Unknown id returns 500 | `findById(id).get()` throws `NoSuchElementException`, which has no handler, so it becomes a 500 | `findById(id).orElseThrow(() -> new OrderNotFoundException(id))`. The existing handler returns a 404 problem-details body |
| 4 | Invalid input accepted | Only the **API** (`jakarta.validation-api`) is on the classpath, with no **provider** (Hibernate Validator). Spring Boot only enables method/argument validation when a provider is present, so `@Valid` is silently ignored | Replace the API dependency with `spring-boot-starter-validation`. Invalid requests then get 400 |
| 5 | Partial writes; orders stay `NEW` | `@Transactional` is applied by a Spring **proxy**. A `private` method is never proxied, and `placeOrder` calls it via `this`, so the call bypasses the proxy either way. `save()` commits in its own repository transaction, a reservation failure can''t roll it back, and `markReserved()` runs on a detached entity, so it is never flushed | Put `@Transactional` on the public `placeOrder` and inline the logic, or move it to a separate bean. The save, reservation and status change then commit or roll back together |

**Good signs in a candidate''s answer:**
- Clearly explains proxy-based AOP and self-invocation, not just "make it public".
- Mentions that a remote call (the inventory reservation) inside a DB transaction holds the transaction open. They may suggest an outbox/saga or a compensating cancel as a production improvement (bonus, not required).
- Suggests tests: `@WebMvcTest` for 400/404, and `@SpringBootTest` with a mocked `InventoryClient` throwing, asserting no orders remain.

**Red flags:**
- `ddl-auto=update` presented as the production fix.
- Catching `NoSuchElementException` in the controller and returning `null`.
- Adding `@Validated` everywhere without adding a validation provider.
', '[{"path":"pom.xml","content":"<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<project xmlns=\"http://maven.apache.org/POM/4.0.0\"\n         xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"\n         xsi:schemaLocation=\"http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd\">\n  <modelVersion>4.0.0</modelVersion>\n\n  <parent>\n    <groupId>org.springframework.boot</groupId>\n    <artifactId>spring-boot-starter-parent</artifactId>\n    <version>3.5.6</version>\n    <relativePath/>\n  </parent>\n\n  <groupId>com.zycus</groupId>\n  <artifactId>orders-service</artifactId>\n  <version>1.8.0</version>\n  <name>orders-service</name>\n\n  <properties>\n    <java.version>21</java.version>\n  </properties>\n\n  <dependencies>\n    <dependency>\n      <groupId>org.springframework.boot</groupId>\n      <artifactId>spring-boot-starter-web</artifactId>\n    </dependency>\n    <dependency>\n      <groupId>org.springframework.boot</groupId>\n      <artifactId>spring-boot-starter-data-jpa</artifactId>\n    </dependency>\n    <!-- Brings the Bean Validation API *and* the Hibernate Validator provider -->\n    <dependency>\n      <groupId>org.springframework.boot</groupId>\n      <artifactId>spring-boot-starter-validation</artifactId>\n    </dependency>\n    <dependency>\n      <groupId>com.h2database</groupId>\n      <artifactId>h2</artifactId>\n      <scope>runtime</scope>\n    </dependency>\n    <dependency>\n      <groupId>org.springframework.boot</groupId>\n      <artifactId>spring-boot-starter-test</artifactId>\n      <scope>test</scope>\n    </dependency>\n  </dependencies>\n\n  <build>\n    <plugins>\n      <plugin>\n        <groupId>org.springframework.boot</groupId>\n        <artifactId>spring-boot-maven-plugin</artifactId>\n      </plugin>\n    </plugins>\n  </build>\n</project>\n"},{"path":"src/main/resources/application.properties","content":"spring.application.name=orders-service\nserver.port=8080\n\n# In-memory database for local development and CI\nspring.datasource.url=jdbc:h2:mem:orders;DB_CLOSE_DELAY=-1\nspring.datasource.username=sa\nspring.datasource.password=\n\n# The in-memory DB starts empty: let Hibernate create the schema for dev/CI.\n# Production uses Flyway migrations with ddl-auto=validate.\nspring.jpa.hibernate.ddl-auto=create-drop\nspring.jpa.open-in-view=false\n\n# RFC 9457 problem-details responses for errors\nspring.mvc.problemdetails.enabled=true\n\ninventory.base-url=http://localhost:8090\ninventory.timeout=2s\n"},{"path":"src/main/java/com/zycus/orders/web/OrderController.java","content":"package com.zycus.orders.web;\n\nimport com.zycus.orders.service.OrderService;\nimport com.zycus.orders.web.dto.CreateOrderRequest;\nimport com.zycus.orders.web.dto.OrderResponse;\nimport jakarta.validation.Valid;\nimport java.net.URI;\nimport java.util.List;\nimport org.springframework.http.ResponseEntity;\nimport org.springframework.web.bind.annotation.GetMapping;\nimport org.springframework.web.bind.annotation.PathVariable;\nimport org.springframework.web.bind.annotation.PostMapping;\nimport org.springframework.web.bind.annotation.RequestBody;\nimport org.springframework.web.bind.annotation.RequestMapping;\nimport org.springframework.web.bind.annotation.RequestParam;\nimport org.springframework.web.bind.annotation.RestController;\n\n@RestController\n@RequestMapping(\"/api/orders\")\npublic class OrderController {\n\n    private final OrderService orderService;\n\n    public OrderController(OrderService orderService) {\n        this.orderService = orderService;\n    }\n\n    @PostMapping\n    public ResponseEntity<OrderResponse> create(@Valid @RequestBody CreateOrderRequest request) {\n        OrderResponse created = orderService.placeOrder(request);\n        return ResponseEntity.created(URI.create(\"/api/orders/\" + created.id())).body(created);\n    }\n\n    @GetMapping(\"/{orderId}\")\n    public OrderResponse get(@PathVariable(\"orderId\") Long id) {\n        return orderService.getOrder(id);\n    }\n\n    @GetMapping\n    public List<OrderResponse> listForCustomer(@RequestParam String customerEmail) {\n        return orderService.ordersForCustomer(customerEmail);\n    }\n}\n"},{"path":"src/main/java/com/zycus/orders/service/OrderService.java","content":"package com.zycus.orders.service;\n\nimport com.zycus.orders.domain.PurchaseOrder;\nimport com.zycus.orders.inventory.InventoryClient;\nimport com.zycus.orders.repository.OrderRepository;\nimport com.zycus.orders.web.ApiExceptionHandler.OrderNotFoundException;\nimport com.zycus.orders.web.dto.CreateOrderRequest;\nimport com.zycus.orders.web.dto.OrderResponse;\nimport java.util.List;\nimport org.springframework.stereotype.Service;\nimport org.springframework.transaction.annotation.Transactional;\n\n@Service\npublic class OrderService {\n\n    private final OrderRepository orderRepository;\n    private final InventoryClient inventoryClient;\n\n    public OrderService(OrderRepository orderRepository, InventoryClient inventoryClient) {\n        this.orderRepository = orderRepository;\n        this.inventoryClient = inventoryClient;\n    }\n\n    /**\n     * Runs in one transaction through the Spring proxy (public method, called from the controller):\n     * a failed reservation rolls the order back, and markReserved() is flushed on commit.\n     */\n    @Transactional\n    public OrderResponse placeOrder(CreateOrderRequest request) {\n        PurchaseOrder order = orderRepository.save(\n                new PurchaseOrder(request.customerEmail(), request.sku(), request.quantity()));\n        // Throws InsufficientStockException (mapped to 409) when stock is not available.\n        inventoryClient.reserve(request.sku(), request.quantity());\n        order.markReserved();\n        return OrderResponse.from(order);\n    }\n\n    @Transactional(readOnly = true)\n    public OrderResponse getOrder(Long id) {\n        return orderRepository.findById(id)\n                .map(OrderResponse::from)\n                .orElseThrow(() -> new OrderNotFoundException(id));\n    }\n\n    @Transactional(readOnly = true)\n    public List<OrderResponse> ordersForCustomer(String customerEmail) {\n        return orderRepository.findByCustomerEmailOrderByCreatedAtDesc(customerEmail).stream()\n                .map(OrderResponse::from)\n                .toList();\n    }\n}\n"}]'::jsonb
) on conflict (question_id) do nothing;

-- Template: lead-react-native-hands-on
insert into public.test_templates (id, slug, name, target_role, description, duration_minutes, instructions_md, proctoring, violation_policy, is_active) values (
  '704cf1f2-2916-4eb4-a7b6-cc9894509b41', 'lead-react-native-hands-on', 'Lead React Native Developer – Hands-On', 'Lead React Native Developer', 'Four debugging tasks across a React Native app and a Spring Boot service. Questions 3 and 4 are placeholders until Zycus adds the final tasks.', 150,
  '## About this assessment

This is a **hands-on debugging assessment** for the **Lead React Native Developer** role. It has **4 questions** and lasts **150 minutes** in one sitting. The timer starts when you press **Start assessment** and keeps running even if you close the browser.

Each question gives you a small codebase with reported bugs. Fix the code directly in the editor and explain each root cause in the **Explain your fix** box. You can''t run the code. We assess your reasoning, the correctness of your fixes, and the clarity of your explanation.

## How to work

- Move between questions at any time with the navigator on the left. Use **Mark for review** to come back to a question.
- Your work is saved automatically every few seconds on this device and on Zycus servers. If your connection drops, keep working: your changes sync when it returns.
- If the page reloads or your browser closes, sign in again with the same email and access code. You''ll continue where you left off, with the time that remains.
- Press **Submit** when you''re done. You can''t change your answers after submitting. When the time is up, your work is submitted automatically.

## Rules

- Work alone. Don''t use other websites, AI tools, notes or other people.
- Stay in full-screen mode, in this tab, on one screen, with your webcam on and your face visible.
- Pasting, copying the questions, right-clicking and developer tools are disabled. Attempts are logged.
- Don''t share these questions or your answers with anyone, during or after the assessment.
',
  '{"fullscreen":{"enabled":true},"keyboardLock":{"enabled":true},"tabSwitch":{"enabled":true},"windowBlur":{"enabled":true,"graceMs":1500},"paste":{"enabled":true,"allowInternalClipboard":false},"dragDrop":{"enabled":true},"suspiciousInsert":{"enabled":true,"thresholdChars":60},"typingCadence":{"enabled":true,"maxCharsPerSecond":25},"copyProtection":{"enabled":true},"blockedShortcuts":{"enabled":true},"devtoolsHeuristic":{"enabled":true},"multiTab":{"enabled":true},"multiMonitor":{"enabled":true,"blockStartIfExtended":true,"pollMs":5000},"webcam":{"enabled":true,"required":true,"snapshotIntervalSec":150,"snapshotOnViolation":true},"faceDetection":{"enabled":true,"intervalMs":2000,"noFaceSeconds":10,"multiFaceConsecutive":2},"microphone":{"enabled":false,"loudDbfs":-20,"sustainSec":3},"watermark":{"enabled":true,"opacity":0.06},"keystrokeReplay":{"enabled":true}}'::jsonb,
  '{"warnOnOccurrences":2,"maxTotalViolations":5,"onLimit":"auto_submit","countedTypes":["tab_switch","window_blur","fullscreen_exit","second_tab","session_takeover","multi_monitor","camera_off","no_face","multiple_faces"]}'::jsonb, true
) on conflict (id) do nothing;
insert into public.test_template_questions (template_id, question_id, position) values
  ('704cf1f2-2916-4eb4-a7b6-cc9894509b41', 'f50a2b49-3263-4569-bd97-ff8835a45436', 1),
  ('704cf1f2-2916-4eb4-a7b6-cc9894509b41', 'c32fe8c1-9276-4190-9b2c-3c9b6509809f', 2),
  ('704cf1f2-2916-4eb4-a7b6-cc9894509b41', '1ddcb8b2-aade-4a1f-a449-f31014cceaf7', 3),
  ('704cf1f2-2916-4eb4-a7b6-cc9894509b41', 'ad17df1c-902d-4b7f-9054-8f0bec4873e2', 4)
on conflict (template_id, question_id) do nothing;

commit;

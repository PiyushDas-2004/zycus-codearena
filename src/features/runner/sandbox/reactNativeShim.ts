/**
 * React Native for the test sandbox: host components render as plain named elements ('View',
 * 'Text', …) that react-test-renderer can query, and native modules are small in-memory fakes that
 * tests can drive (AppState changes, AsyncStorage latency, focus/blur, network status).
 * Behaviour that debugging questions rely on is kept faithful: FlatList is a PureComponent-like
 * memo (so a mutated `data` array does not re-render), keyExtractor/renderItem semantics, and
 * duplicate keys produce React's own warning.
 */
import * as React from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any */

const h = React.createElement;

function host(name: string) {
  const C = React.forwardRef<unknown, any>(function HostComponent(props, ref) {
    return h(name, { ...props, ref });
  });
  C.displayName = name;
  return C;
}

export const View = host('View');
export const Text = host('Text');
export const ScrollView = host('ScrollView');
export const SafeAreaView = host('SafeAreaView');
export const KeyboardAvoidingView = host('KeyboardAvoidingView');
export const Image = host('Image');
export const TextInput = host('TextInput');
export const ActivityIndicator = host('ActivityIndicator');
export const Switch = host('Switch');
export const TouchableOpacity = host('TouchableOpacity');
export const TouchableHighlight = host('TouchableHighlight');
export const TouchableWithoutFeedback = host('TouchableWithoutFeedback');
export const RefreshControl = host('RefreshControl');
/** Renders nothing (the status bar isn't part of the component tree in tests). */
export const StatusBar = Object.assign((_props: Record<string, unknown>) => null, {
  setBarStyle() {},
  setHidden() {},
  setBackgroundColor() {},
  currentHeight: 24,
});

export function Pressable(props: any) {
  const { children, style, ...rest } = props;
  const state = { pressed: false, hovered: false };
  return h(
    'Pressable',
    { ...rest, style: typeof style === 'function' ? style(state) : style },
    typeof children === 'function' ? children(state) : children,
  );
}

export function Button(props: { title: string; onPress?: () => void; disabled?: boolean; testID?: string }) {
  return h('Button', { ...props, accessibilityRole: 'button' }, h('Text', null, props.title));
}

export function Modal(props: any) {
  const { visible = true, children, ...rest } = props;
  return visible ? h('Modal', rest, children) : null;
}

const renderSlot = (C: any) => (C == null ? null : React.isValidElement(C) ? C : h(C));

/** FlatList: renders every item (no virtualisation), memoised like RN's PureComponent list. */
function FlatListImpl(props: any) {
  const {
    data,
    renderItem,
    keyExtractor,
    ListHeaderComponent,
    ListFooterComponent,
    ListEmptyComponent,
    ItemSeparatorComponent,
    ...rest
  } = props;
  const items: React.ReactNode[] = [];
  (data ?? []).forEach((item: any, index: number) => {
    const key = keyExtractor ? keyExtractor(item, index) : (item?.key ?? item?.id ?? String(index));
    if (index > 0 && ItemSeparatorComponent) items.push(h(ItemSeparatorComponent, { key: `sep-${key}` }));
    items.push(
      h(
        React.Fragment,
        { key },
        renderItem({
          item,
          index,
          separators: { highlight() {}, unhighlight() {}, updateProps() {} },
        }),
      ),
    );
  });
  return h(
    'FlatList',
    rest,
    renderSlot(ListHeaderComponent),
    items.length ? items : renderSlot(ListEmptyComponent),
    renderSlot(ListFooterComponent),
  );
}
export const FlatList = React.memo(FlatListImpl);
(FlatList as any).displayName = 'FlatList';

export function SectionList(props: any) {
  const { sections, renderItem, renderSectionHeader, keyExtractor, ...rest } = props;
  return h(
    'SectionList',
    rest,
    (sections ?? []).map((section: any, si: number) =>
      h(
        React.Fragment,
        { key: section.key ?? `section-${si}` },
        renderSectionHeader ? renderSectionHeader({ section }) : null,
        section.data.map((item: any, index: number) =>
          h(
            React.Fragment,
            { key: keyExtractor ? keyExtractor(item, index) : (item?.key ?? item?.id ?? String(index)) },
            renderItem({ item, index, section }),
          ),
        ),
      ),
    ),
  );
}

export const StyleSheet = {
  create: <T>(styles: T) => styles,
  flatten: (style: any): Record<string, unknown> =>
    Array.isArray(style)
      ? Object.assign(
          {},
          ...style
            .flat(Infinity)
            .filter(Boolean)
            .map((s: any) => StyleSheet.flatten(s)),
        )
      : (style ?? {}),
  compose: (a: any, b: any) => (a && b ? [a, b] : (a ?? b)),
  hairlineWidth: 1,
  absoluteFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  absoluteFillObject: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
};

export const Platform = {
  OS: 'ios' as 'ios' | 'android',
  Version: 17,
  select: <T>(o: { ios?: T; android?: T; native?: T; default?: T }) => o.ios ?? o.native ?? o.default,
};

const windowSize = { width: 390, height: 844, scale: 3, fontScale: 1 };
export const Dimensions = {
  get: () => ({ ...windowSize }),
  addEventListener: () => ({ remove() {} }),
};
export const useWindowDimensions = () => ({ ...windowSize });
export const useColorScheme = () => 'light';
export const PixelRatio = { get: () => 3, roundToNearestPixel: (n: number) => n };

// ── AppState (tests drive it with setAppState) ─────────────────────────────
type AppStateStatus = 'active' | 'background' | 'inactive';
const appStateListeners = new Set<(s: AppStateStatus) => void>();
export const AppState = {
  currentState: 'active' as AppStateStatus,
  addEventListener(type: string, listener: (s: AppStateStatus) => void) {
    if (type !== 'change') return { remove() {} };
    appStateListeners.add(listener);
    return { remove: () => appStateListeners.delete(listener) };
  },
  /** Removed in RN 0.70+: kept so calling it fails loudly like on a device. */
  removeEventListener() {
    throw new TypeError('AppState.removeEventListener is not a function (removed in React Native 0.70)');
  },
};
export const appStateControl = {
  set(next: AppStateStatus) {
    AppState.currentState = next;
    for (const l of [...appStateListeners]) l(next);
  },
  listenerCount: () => appStateListeners.size,
  reset() {
    AppState.currentState = 'active';
    appStateListeners.clear();
  },
};

export const Keyboard = { dismiss() {}, addListener: () => ({ remove() {} }) };
const alerts: { title: string; message?: string }[] = [];
export const Alert = {
  alert: (title: string, message?: string) => {
    alerts.push({ title, message });
  },
};
export const alertControl = { calls: () => [...alerts], reset: () => (alerts.length = 0) };
export const Linking = { openURL: async () => undefined, canOpenURL: async () => true };
export const Vibration = { vibrate() {}, cancel() {} };
export const InteractionManager = {
  runAfterInteractions(cb: () => void) {
    const t = setTimeout(cb, 0);
    return { cancel: () => clearTimeout(t), then: (f: () => void) => setTimeout(f, 0) };
  },
};
export const NativeModules = {};
export const I18nManager = { isRTL: false };

// ── AsyncStorage (in memory; tests can add latency) ───────────────────────
const store = new Map<string, string>();
let latencyMs = 0;
const later = <T>(fn: () => T) =>
  new Promise<T>((resolve, reject) => {
    const run = () => {
      try {
        resolve(fn());
      } catch (e) {
        reject(e);
      }
    };
    if (latencyMs > 0) setTimeout(run, latencyMs);
    else Promise.resolve().then(run);
  });

export const AsyncStorage = {
  getItem: (k: string) => later(() => (store.has(k) ? store.get(k)! : null)),
  setItem: (k: string, v: string) =>
    later(() => {
      if (typeof v !== 'string')
        throw new TypeError(`AsyncStorage.setItem: value for "${k}" must be a string`);
      store.set(k, v);
    }),
  removeItem: (k: string) => later(() => void store.delete(k)),
  mergeItem: (k: string, v: string) =>
    later(() => void store.set(k, JSON.stringify({ ...JSON.parse(store.get(k) ?? '{}'), ...JSON.parse(v) }))),
  clear: () => later(() => store.clear()),
  getAllKeys: () => later(() => [...store.keys()]),
  multiGet: (keys: string[]) =>
    later(() => keys.map((k) => [k, store.get(k) ?? null] as [string, string | null])),
  multiSet: (pairs: [string, string][]) => later(() => pairs.forEach(([k, v]) => store.set(k, v))),
  multiRemove: (keys: string[]) => later(() => keys.forEach((k) => store.delete(k))),
};
export const asyncStorageControl = {
  /** Every AsyncStorage call resolves after `ms` (driven by fake timers when they are on). */
  setLatency: (ms: number) => (latencyMs = ms),
  seed: (entries: Record<string, string>) => Object.entries(entries).forEach(([k, v]) => store.set(k, v)),
  snapshot: () => Object.fromEntries(store),
  reset() {
    store.clear();
    latencyMs = 0;
  },
};

// ── @react-navigation/native (focus lifecycle only) ───────────────────────
type FocusListener = { focus: () => (() => void) | void; cleanup?: (() => void) | void };
const focusEffects = new Set<FocusListener>();
let focused = true;
export function useFocusEffect(effect: () => (() => void) | void) {
  // Like React Navigation: re-run when the callback identity changes (so wrap it in useCallback).
  React.useEffect(() => {
    const entry: FocusListener = { focus: effect };
    focusEffects.add(entry);
    if (focused) entry.cleanup = effect();
    return () => {
      focusEffects.delete(entry);
      if (typeof entry.cleanup === 'function') entry.cleanup();
      entry.cleanup = undefined;
    };
  }, [effect]);
}
export const useIsFocused = () => focused;
export const useNavigation = () => ({
  navigate() {},
  goBack() {},
  setOptions() {},
  addListener: () => () => {},
});
export const useRoute = () => ({ params: {} });
export const navigationControl = {
  blur() {
    if (!focused) return;
    focused = false;
    for (const e of focusEffects) {
      if (typeof e.cleanup === 'function') e.cleanup();
      e.cleanup = undefined;
    }
  },
  focus() {
    if (focused) return;
    focused = true;
    for (const e of focusEffects) e.cleanup = e.focus();
  },
  reset() {
    focused = true;
    focusEffects.clear();
  },
};

export function resetNativeFakes() {
  appStateControl.reset();
  alertControl.reset();
  asyncStorageControl.reset();
  navigationControl.reset();
}

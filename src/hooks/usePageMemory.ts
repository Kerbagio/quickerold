import {
  useCallback,
  useRef,
  useSyncExternalStore,
  type Dispatch,
  type SetStateAction,
} from "react";

const memory = new Map<string, unknown>();
const listeners = new Map<string, Set<() => void>>();

type InitialValue<T> = T | (() => T);

function resolveInitialValue<T>(initialValue: InitialValue<T>): T {
  return typeof initialValue === "function"
    ? (initialValue as () => T)()
    : initialValue;
}

function notify(key: string): void {
  listeners.get(key)?.forEach((listener) => listener());
}

function subscribe(key: string, listener: () => void): () => void {
  const keyListeners = listeners.get(key) ?? new Set<() => void>();
  keyListeners.add(listener);
  listeners.set(key, keyListeners);

  return () => {
    keyListeners.delete(listener);
    if (!keyListeners.size) listeners.delete(key);
  };
}

export function readPageMemory<T>(
  key: string,
  initialValue: InitialValue<T>,
): T {
  if (memory.has(key)) return memory.get(key) as T;
  const value = resolveInitialValue(initialValue);
  memory.set(key, value);
  return value;
}

export function writePageMemory<T>(
  key: string,
  action: SetStateAction<T>,
): T {
  const current = memory.get(key) as T;
  const next =
    typeof action === "function"
      ? (action as (previous: T) => T)(current)
      : action;
  memory.set(key, next);
  notify(key);
  return next;
}

export function clearPageMemory(prefix?: string): void {
  const keys = new Set([...memory.keys(), ...listeners.keys()]);
  const matchingKeys = [...keys].filter(
    (key) => !prefix || key.startsWith(prefix),
  );

  matchingKeys.forEach((key) => memory.delete(key));
  matchingKeys.forEach(notify);
}

/**
 * Keeps page state while the user navigates inside this SPA. The values stay
 * only in JavaScript memory and disappear on a full reload or when the tab is
 * closed, so precise location data is never written to browser storage.
 */
export function usePageMemory<T>(
  key: string,
  initialValue: InitialValue<T>,
): [T, Dispatch<SetStateAction<T>>] {
  const initialValueRef = useRef(initialValue);
  const subscribeToKey = useCallback(
    (listener: () => void) => subscribe(key, listener),
    [key],
  );
  const getSnapshot = useCallback(
    () => readPageMemory(key, initialValueRef.current),
    [key],
  );
  const state = useSyncExternalStore(subscribeToKey, getSnapshot, getSnapshot);

  const setMemoryState = useCallback<Dispatch<SetStateAction<T>>>(
    (action) => {
      writePageMemory<T>(key, action);
    },
    [key],
  );

  return [state, setMemoryState];
}

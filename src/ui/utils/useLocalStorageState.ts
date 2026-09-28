import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

export function useLocalStorageState<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored === null ? initialValue : JSON.parse(stored) as T;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage may be unavailable in restricted browser contexts.
    }
  }, [key, value]);

  return [value, setValue];
}

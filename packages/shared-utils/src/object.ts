/**
 * Object utilities
 */

export const pick = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
};

export const omit = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
};

export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

export const deepMerge = <T extends object>(target: T, source: Partial<T>): T => {
  const result = { ...target };

  for (const key in source) {
    if (source[key] instanceof Object && key in target) {
      (result as any)[key] = deepMerge(
        (target as any)[key],
        (source as any)[key]
      );
    } else {
      (result as any)[key] = source[key];
    }
  }

  return result;
};

export const isEmpty = (obj: object): boolean => {
  return Object.keys(obj).length === 0;
};

export const hasKey = <T extends object>(
  obj: T,
  key: PropertyKey
): key is keyof T => {
  return key in obj;
};

export const mapValues = <T extends object, U>(
  obj: T,
  fn: (value: T[keyof T], key: keyof T) => U
): Record<keyof T, U> => {
  const result = {} as Record<keyof T, U>;
  for (const key in obj) {
    result[key] = fn(obj[key], key);
  }
  return result;
};

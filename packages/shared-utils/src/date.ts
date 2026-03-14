/**
 * Date utilities
 */

export const formatDate = (date: Date, format: 'short' | 'long' | 'iso' = 'short'): string => {
  switch (format) {
    case 'short':
      return date.toLocaleDateString();
    case 'long':
      return date.toLocaleString();
    case 'iso':
      return date.toISOString();
    default:
      return date.toLocaleDateString();
  }
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const addHours = (date: Date, hours: number): Date => {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
};

export const diffInDays = (date1: Date, date2: Date): number => {
  const ms = Math.abs(date1.getTime() - date2.getTime());
  return Math.floor(ms / (1000 * 60 * 60 * 24));
};

export const diffInHours = (date1: Date, date2: Date): number => {
  const ms = Math.abs(date1.getTime() - date2.getTime());
  return Math.floor(ms / (1000 * 60 * 60));
};

export const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

export const isFuture = (date: Date): boolean => {
  return date.getTime() > Date.now();
};

export const isPast = (date: Date): boolean => {
  return date.getTime() < Date.now();
};

export const startOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

export const endOfDay = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

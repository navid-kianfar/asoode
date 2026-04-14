import { BadRequestException } from '@nestjs/common';

/**
 * Safely parses a date value. Returns a valid Date or throws BadRequestException.
 * Use this for required date parameters in queries.
 */
export function parseDate(value: unknown, fieldName?: string): Date {
  if (value === null || value === undefined || value === '') {
    throw new BadRequestException(
      `Invalid date${fieldName ? ` for '${fieldName}'` : ''}: value is empty`,
    );
  }

  const date = value instanceof Date ? value : new Date(value as string | number);

  if (isNaN(date.getTime())) {
    throw new BadRequestException(
      `Invalid date${fieldName ? ` for '${fieldName}'` : ''}: '${value}'`,
    );
  }

  return date;
}

/**
 * Safely parses a date value. Returns a valid Date or the provided fallback.
 * Use this for optional date parameters with defaults.
 */
export function parseDateOrDefault(value: unknown, fallback: Date): Date {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  const date = value instanceof Date ? value : new Date(value as string | number);

  return isNaN(date.getTime()) ? fallback : date;
}

/**
 * Safely parses a date value. Returns a valid Date or null.
 * Use this for nullable date fields (e.g. clearing a date).
 */
export function parseDateOrNull(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value as string | number);

  return isNaN(date.getTime()) ? null : date;
}

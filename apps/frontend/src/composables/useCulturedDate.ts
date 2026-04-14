import { useCultureStore } from '@/stores/culture.store';
import type { IDateConverter, IDateTimeProperties } from '@asoode/shared';
import { format, formatDistance } from 'date-fns';

class GregorianConverter implements IDateConverter {
  ToDateTime(date: IDateTimeProperties): Date {
    return new Date(date.Year, date.Month - 1, date.Day, date.Hours || 0, date.Minutes || 0, date.Seconds || 0);
  }

  Now(): IDateTimeProperties {
    return this.FromDateTime(new Date());
  }

  Parse(date: IDateTimeProperties): IDateTimeProperties {
    return date;
  }

  FromDateTime(date: Date): IDateTimeProperties {
    return {
      Year: date.getFullYear(),
      Month: date.getMonth() + 1,
      Day: date.getDate(),
      Hours: date.getHours(),
      Minutes: date.getMinutes(),
      Seconds: date.getSeconds(),
      Milliseconds: date.getMilliseconds(),
    };
  }

  Format(date: Date, fmt: string): string {
    try {
      return format(date, fmt);
    } catch {
      return date.toLocaleDateString();
    }
  }

  IsValid(date: string | IDateTimeProperties): boolean {
    if (typeof date === 'string') {
      return !isNaN(new Date(date).getTime());
    }
    return date.Year > 0 && date.Month > 0 && date.Day > 0;
  }
}

export function useCulturedDate() {
  const cultureStore = useCultureStore();

  function getConverter(): IDateConverter {
    // For now, return Gregorian converter
    // Persian and Hijri converters can be added later with date-fns-jalali
    return new GregorianConverter();
  }

  function formatDate(date: Date | string | undefined, fmt?: string): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';

    const converter = getConverter();
    return converter.Format(d, fmt || 'yyyy/MM/dd');
  }

  function formatDateTime(date: Date | string | undefined): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';

    const converter = getConverter();
    return converter.Format(d, 'yyyy/MM/dd HH:mm');
  }

  function fromNow(date: Date | string | undefined): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';

    try {
      return formatDistance(d, new Date(), { addSuffix: true });
    } catch {
      return '';
    }
  }

  return { getConverter, formatDate, formatDateTime, fromNow };
}

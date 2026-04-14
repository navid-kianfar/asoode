import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { WeekDay, type ICulture } from '@asoode/shared';

const cultures: Record<string, ICulture> = {
  fa: {
    direction: 'rtl',
    rtl: true,
    lang: 'fa',
    culture: 'fa-IR',
    dayNames: ['شنبه', 'یک شنبه', 'دوشنبه', 'سه شنبه', 'چهارشنبه', 'پنج شنبه', 'جمعه'],
    dayNamesShort: ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'],
    monthNames: ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'],
    daysInMonths: [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29],
    moneySign: 'ریال',
    startDay: WeekDay.Saturday,
    weekMap: {},
  },
  ar: {
    direction: 'rtl',
    rtl: true,
    lang: 'ar',
    culture: 'ar-SA',
    dayNames: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
    dayNamesShort: ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'],
    monthNames: ['مُحَرَّم', 'صَفَر', 'رَبِيع الأَوَّل', 'رَبِيع الثَّانِي', 'جُمَادَى الأُولَى', 'جُمَادَى الثَّانِيَة', 'رَجَب', 'شَعْبَان', 'رَمَضَان', 'شَوَّال', 'ذُو القَعْدَة', 'ذُو الحِجَّة'],
    daysInMonths: [30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29],
    moneySign: 'ر.س',
    startDay: WeekDay.Monday,
    weekMap: {},
  },
  en: {
    direction: 'ltr',
    rtl: false,
    lang: 'en',
    culture: 'en-US',
    dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    daysInMonths: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
    moneySign: '$',
    startDay: WeekDay.Sunday,
    weekMap: {},
  },
  fr: {
    direction: 'ltr',
    rtl: false,
    lang: 'fr',
    culture: 'fr-FR',
    dayNames: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
    dayNamesShort: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
    monthNames: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
    daysInMonths: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
    moneySign: '€',
    startDay: WeekDay.Monday,
    weekMap: {},
  },
};

export const useCultureStore = defineStore('culture', () => {
  const lang = ref(document.documentElement.lang || 'en');
  const dir = ref(document.documentElement.dir || 'ltr');
  const current = computed<ICulture>(() => cultures[lang.value] || cultures.en);

  return { lang, dir, current };
});

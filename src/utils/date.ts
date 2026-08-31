// Bengali Date and Time Formatting Utility

const BENGALI_NUMERALS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const BENGALI_MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

export function toBengaliNumerals(input: number | string): string {
  return String(input).replace(/[0-9]/g, (w) => BENGALI_NUMERALS[+w]);
}

export function formatTimeBengali(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const minutesStr = minutes < 10 ? '0' + minutes : String(minutes);
  return `${toBengaliNumerals(hours)}:${toBengaliNumerals(minutesStr)} ${ampm}`;
}

export function formatBengaliDateTime(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = new Date();
  
  const isToday = 
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = 
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const timeStr = formatTimeBengali(date);

  if (isToday) {
    return `আজ, ${timeStr}`;
  }
  if (isYesterday) {
    return `গতকাল, ${timeStr}`;
  }

  const day = toBengaliNumerals(date.getDate());
  const month = BENGALI_MONTHS[date.getMonth()];
  const year = toBengaliNumerals(date.getFullYear());

  return `${day} ${month} ${year}, ${timeStr}`;
}

export function formatExactDate(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const day = toBengaliNumerals(date.getDate());
  const month = BENGALI_MONTHS[date.getMonth()];
  const year = toBengaliNumerals(date.getFullYear());
  const timeStr = formatTimeBengali(date);
  return `${day} ${month} ${year} • ${timeStr}`;
}

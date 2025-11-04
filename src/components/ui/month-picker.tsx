"use client";

import { useEffect } from "react";
import DatePicker from "react-datepicker";
import { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useLocale } from "next-intl";

// Import locale data
import { fr } from "date-fns/locale";
import { zhCN } from "date-fns/locale";
import { enUS } from "date-fns/locale";

interface MonthPickerProps {
  selected: Date;
  onChange: (date: Date | null) => void;
  className?: string;
}

export function MonthPicker({ selected, onChange, className }: MonthPickerProps) {
  const locale = useLocale();

  // Set up locale for react-datepicker
  useEffect(() => {
    const localeMap = {
      en: enUS,
      zh: zhCN,
      fr: fr,
    };

    const selectedLocale = localeMap[locale as keyof typeof localeMap] || enUS;
    registerLocale(locale, selectedLocale);
  }, [locale]);

  return (
    <DatePicker
      selected={selected}
      onChange={onChange}
      dateFormat="MM/yyyy"
      showMonthYearPicker
      showFullMonthYearPicker
      locale={locale}
      className={className}
    />
  );
}
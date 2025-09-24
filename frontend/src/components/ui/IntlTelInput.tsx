import React, { useEffect, useRef } from 'react';
import intlTelInput from 'intl-tel-input';
import 'intl-tel-input/build/css/intlTelInput.css';

type CountryDataLite = {
  name?: string;
  iso2?: string;
  dialCode?: string | number;
  priority?: number;
  areaCodes?: string[];
};

type Props = {
  value?: string; // e.g. +911234567890
  onChange?: (fullNumber: string, country: Partial<CountryDataLite>) => void;
  preferredCountries?: string[]; // e.g. ['in','us']
  disabled?: boolean;
  className?: string;
  containerClassName?: string;
};

const IntlTelInput: React.FC<Props> = ({
  value,
  onChange,
  preferredCountries = ['in', 'us', 'gb', 'ae', 'sg'],
  disabled,
  className,
  containerClassName,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const itiRef = useRef<ReturnType<typeof intlTelInput> | null>(null);

  useEffect(() => {
    if (!inputRef.current) return;
    // Initialize plugin
    itiRef.current = intlTelInput(inputRef.current, {
      // Avoid geoIp to keep it simple and offline-friendly
      initialCountry: 'in',
      preferredCountries,
      nationalMode: false,
      autoHideDialCode: false,
      separateDialCode: false,
      dropdownContainer: typeof document !== 'undefined' ? document.body : undefined,
      // No utilsScript to keep bundle small; we'll compute numbers manually
    } as any);

    const handleInput = () => {
      if (!itiRef.current || !inputRef.current) return;
  const country = itiRef.current.getSelectedCountryData() as unknown as CountryDataLite;
      const raw = inputRef.current.value || '';
      const digits = raw.replace(/\D/g, '');
      const dial = (country?.dialCode ?? '').toString();
      // Ensure full E.164 like number
      const full = dial ? `+${dial}${digits.startsWith(dial) ? digits.slice(dial.length) : digits}` : `+${digits}`;
      onChange?.(full, country);
    };

    const el = inputRef.current;
    el.addEventListener('input', handleInput);
    el.addEventListener('countrychange', handleInput as EventListener);

    // Set initial value if provided
    if (value) {
      try {
        // Set the number directly; if plugin can't format, it still sets input value
        itiRef.current.setNumber(value);
      } catch {}
    }

    return () => {
      el.removeEventListener('input', handleInput);
      el.removeEventListener('countrychange', handleInput as EventListener);
      itiRef.current?.destroy();
      itiRef.current = null;
    };
  }, []);

  // Update when parent value changes
  useEffect(() => {
    if (value && itiRef.current) {
      try { itiRef.current.setNumber(value); } catch {}
    }
  }, [value]);

  return (
    <div className={containerClassName}>
      <input
        ref={inputRef}
        type="tel"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="tel"
        disabled={disabled}
        className={className}
      />
    </div>
  );
};

export default IntlTelInput;

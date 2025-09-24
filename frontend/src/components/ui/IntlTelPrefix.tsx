import React, { useEffect, useRef } from 'react';
import intlTelInput from 'intl-tel-input';
import 'intl-tel-input/build/css/intlTelInput.css';

type Props = {
  value?: string; // e.g. "+91"
  onChange?: (prefix: string, countryIso?: string) => void;
  preferredCountries?: string[];
  disabled?: boolean;
  className?: string;
};

// Renders only the dropdown flag UI and a small hidden input to satisfy ITI.
// When country changes, emits the dial code as +<dial>
const IntlTelPrefix: React.FC<Props> = ({ value, onChange, preferredCountries = ['in','us','gb','ae','sg'], disabled, className }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const itiRef = useRef<ReturnType<typeof intlTelInput> | null>(null);

  useEffect(() => {
    if (!inputRef.current) return;
    
    const initializeIti = () => {
      if (!inputRef.current) return;
      
      try {
        itiRef.current = intlTelInput(inputRef.current, {
          initialCountry: 'in',
          preferredCountries,
          nationalMode: false,
          autoHideDialCode: false,
          separateDialCode: false,
          dropdownContainer: typeof document !== 'undefined' ? document.body : undefined,
          allowDropdown: true,
          autoPlaceholder: 'off',
        } as any);
      } catch (error) {
        console.warn('Failed to initialize intl-tel-input:', error);
      }
    };
    
    const handleCountryChange = () => {
      if (!itiRef.current) return;
      const c = itiRef.current.getSelectedCountryData() as any;
      const dial = c?.dialCode ? `+${c.dialCode}` : '';
      onChange?.(dial, c?.iso2);
    };

    const el = inputRef.current;
    
    // Small delay to ensure proper initialization
    const timer = setTimeout(() => {
      initializeIti();
      
      if (inputRef.current && itiRef.current) {
        inputRef.current.addEventListener('countrychange', handleCountryChange as EventListener);
        
        // Try to set initial from value
        if (value && value.startsWith('+')) {
          try { 
            itiRef.current.setNumber(value); 
          } catch (error) {
            console.warn('Failed to set initial number:', error);
          }
        }
      }
    }, 10);

    return () => {
      clearTimeout(timer);
      if (el) {
        el.removeEventListener('countrychange', handleCountryChange as EventListener);
      }
      itiRef.current?.destroy();
      itiRef.current = null;
    };
  }, []);

  // Keep selected country in sync when value changes
  useEffect(() => {
    if (value && itiRef.current) {
      try { itiRef.current.setNumber(value); } catch {}
    }
  }, [value]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (inputRef.current && !disabled && itiRef.current) {
      // Focus the input to trigger the dropdown
      inputRef.current.focus();
      
      // Directly open the dropdown using the ITI API
      const wrapper = inputRef.current.closest('.iti');
      const flagContainer = wrapper?.querySelector<HTMLElement>('.iti__selected-flag');
      if (flagContainer) {
        // Simulate a click on the flag container
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        });
        flagContainer.dispatchEvent(clickEvent);
      }
    }
  };

  return (
    <>
      <style>
        {`
          .iti.iti--allow-dropdown {
            width: 100% !important;
            position: relative !important;
          }
          .iti__dropdown-menu {
            min-width: 250px !important;
            max-width: 95vw !important;
            z-index: 99999 !important;
            background: #1e293b !important;
            border: 1px solid #7c3aed !important;
            border-radius: 8px !important;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
            max-height: 200px !important;
            overflow-y: auto !important;
          }
          .iti__country {
            padding: 8px 12px !important;
            cursor: pointer !important;
            color: white !important;
          }
          .iti__country:hover {
            background-color: #3730a3 !important;
          }
          .iti__country.iti__highlight {
            background-color: #7c3aed !important;
          }
          .iti__flag-container {
            cursor: pointer !important;
            position: absolute !important;
            left: 8px !important;
            top: 50% !important;
            transform: translateY(-50%) !important;
            z-index: 2 !important;
          }
          .iti__selected-flag {
            padding: 0 !important;
            background: transparent !important;
            border: none !important;
            cursor: pointer !important;
          }
          .iti__arrow {
            border-left: 4px solid transparent !important;
            border-right: 4px solid transparent !important;
            border-top: 4px solid #a855f7 !important;
          }
        `}
      </style>
      <div className={`relative w-full h-full cursor-pointer ${className}`} onClick={handleClick}>
        <input
          ref={inputRef}
          type="tel"
          className="w-full h-full opacity-0 absolute inset-0"
          disabled={disabled}
          style={{ fontSize: '16px' }}
          tabIndex={-1}
        />
        <div className="absolute inset-0 flex items-center pl-12 pr-4 pointer-events-none">
          <span className="text-white select-none">{value || '+91'}</span>
        </div>
      </div>
    </>
  );
};

export default IntlTelPrefix;

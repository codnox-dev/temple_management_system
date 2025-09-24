declare module 'react-intl-tel-input' {
  import * as React from 'react';

  export interface CountryData {
    name?: string;
    iso2?: string;
    dialCode?: string | number;
    priority?: number;
    areaCodes?: string[];
  }

  export interface ReactIntlTelInputProps {
    containerClassName?: string;
    inputClassName?: string;
    value?: string;
    fieldName?: string;
    preferredCountries?: string[];
    format?: boolean;
    nationalMode?: boolean;
    autoHideDialCode?: boolean;
    separateDialCode?: boolean;
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
    onPhoneNumberChange?: (
      status: boolean,
      value: string,
      countryData: CountryData
    ) => void;
    onSelectFlag?: (currentNumber: string, countryData: CountryData, fullNumber: string, isValid: boolean) => void;
  }

  const ReactIntlTelInput: React.FC<ReactIntlTelInputProps>;
  export default ReactIntlTelInput;
}
// (deprecated) react-intl-tel-input types removed. Using official intl-tel-input via wrapper.

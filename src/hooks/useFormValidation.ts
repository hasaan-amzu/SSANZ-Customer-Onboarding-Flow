import { useState, useCallback } from 'react';

type Validator = (value: string) => string | null;

interface FieldValidators {
  [key: string]: Validator;
}

export function useFormValidation(validators: FieldValidators) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const touch = useCallback((field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const touchAll = useCallback((fields: string[]) => {
    const all: Record<string, boolean> = {};
    fields.forEach(f => { all[f] = true; });
    setTouched(all);
  }, []);

  const getError = useCallback((field: string, value: string): string | null => {
    if (!touched[field]) return null;
    const validator = validators[field];
    if (!validator) return null;
    return validator(value);
  }, [touched, validators]);

  const isValid = useCallback((data: Record<string, string>, requiredFields: string[]): boolean => {
    return requiredFields.every(field => {
      const value = (data[field] || '').trim();
      if (!value) return false;
      const validator = validators[field];
      if (validator && validator(value)) return false;
      return true;
    });
  }, [validators]);

  return { touched, touch, touchAll, getError, isValid };
}

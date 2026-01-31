import { type ChangeEvent, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { parseRut, normalizeRut, rutExpectedDv } from '@/lib/rut';

type RutInputValues = {
  rutFormatted: string;
  rutRaw: string;
};

type RutInputProps = {
  id?: string;
  name?: string;
  placeholder?: string;
  value: string;
  onChange: (values: RutInputValues) => void;
  onBlur?: () => void;
  disabled?: boolean;
  className?: string;
  maxLength?: number;
};

const getRutError = (value: string): string | null => {
  const raw = normalizeRut(value);
  if (raw.length < 2) return null;

  const dv = raw.slice(-1);
  const body = raw.slice(0, -1);

  if (body.length < 7) return null;
  const expected = rutExpectedDv(body);
  if (!expected) return 'RUT inválido';
  if (dv !== expected) return 'RUT inválido';
  return null;
};

export const RutInput = ({
  id,
  name,
  placeholder = '12.345.678-9',
  value,
  onChange,
  onBlur,
  disabled,
  className,
  maxLength = 12,
}: RutInputProps) => {
  const error = useMemo(() => getRutError(value), [value]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const next = parseRut(e.target.value);
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <Input
        id={id}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onBlur={onBlur}
        disabled={disabled}
        className={`${className ?? ''} ${error ? 'border-destructive' : ''}`}
        maxLength={maxLength}
        inputMode="text"
        autoComplete="off"
      />
      {error && <p className="text-sm text-destructive animate-fade-in">{error}</p>}
    </div>
  );
};

export type RutValues = {
  rutFormatted: string;
  rutRaw: string;
};

export const normalizeRut = (value: string): string => {
  const raw = value.replace(/[^0-9kK]/g, '').toUpperCase();
  // Remove leading zeros from body only (keep DV)
  if (raw.length <= 1) return raw;
  const dv = raw.slice(-1);
  const body = raw.slice(0, -1).replace(/^0+/, '');
  return body + dv;
};

export const formatRutFromRaw = (rutRaw: string): string => {
  const raw = normalizeRut(rutRaw);
  if (raw.length === 0) return '';
  if (raw.length === 1) return raw;

  const dv = raw.slice(-1);
  const body = raw.slice(0, -1);

  const reversed = body.split('').reverse();
  const grouped: string[] = [];
  for (let i = 0; i < reversed.length; i += 3) {
    grouped.push(reversed.slice(i, i + 3).reverse().join(''));
  }
  const formattedBody = grouped.reverse().join('.');
  return formattedBody ? `${formattedBody}-${dv}` : dv;
};

export const rutExpectedDv = (body: string): string | null => {
  if (!/^\d{7,9}$/.test(body)) return null;

  let sum = 0;
  let mul = 2;
  for (let i = body.length - 1; i >= 0; i -= 1) {
    sum += Number(body[i]) * mul;
    mul = mul === 7 ? 2 : mul + 1;
  }
  const mod = 11 - (sum % 11);
  if (mod === 11) return '0';
  if (mod === 10) return 'K';
  return String(mod);
};

export const validateRutRaw = (rutRaw: string): boolean | null => {
  const raw = normalizeRut(rutRaw);
  if (raw.length < 2) return null;

  const dv = raw.slice(-1);
  const body = raw.slice(0, -1);

  const expected = rutExpectedDv(body);
  if (!expected) return false;
  return dv === expected;
};

export const parseRut = (input: string): RutValues => {
  const rutRaw = normalizeRut(input);
  return {
    rutRaw,
    rutFormatted: formatRutFromRaw(rutRaw),
  };
};

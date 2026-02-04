import { describe, expect, it } from 'vitest';
import { parseRut, validateRutRaw } from './rut';

describe('rut utils', () => {
  it('11.111.111-1 válido', () => {
    expect(validateRutRaw('11.111.111-1')).toBe(true);
    expect(parseRut('111111111').rutFormatted).toBe('11.111.111-1');
  });

  it('19.405.444-0 válido', () => {
    expect(validateRutRaw('19.405.444-0')).toBe(true);
    expect(parseRut('194054440').rutFormatted).toBe('19.405.444-0');
  });

  it('12.345.678-5 válido', () => {
    expect(validateRutRaw('12.345.678-5')).toBe(true);
    expect(parseRut('123456785').rutFormatted).toBe('12.345.678-5');
  });

  it('1.000.005-K válido', () => {
    expect(validateRutRaw('1.000.005-K')).toBe(true);
    expect(parseRut('1000005k').rutFormatted).toBe('1.000.005-K');
  });

  it('Ejemplos inválidos (módulo 11)', () => {
    expect(validateRutRaw('19.405.444-7')).toBe(false);
    expect(validateRutRaw('12.345.678-K')).toBe(false);
  });

  it('DV inválido', () => {
    expect(validateRutRaw('11.111.111-2')).toBe(false);
  });
});

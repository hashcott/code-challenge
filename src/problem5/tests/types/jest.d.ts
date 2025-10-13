/**
 * Jest Type Definitions
 * Provides type definitions for Jest testing framework
 */

declare global {
  namespace jest {
    interface Matchers<R> {
      toBe(expected: any): R;
      toEqual(expected: any): R;
      toContain(expected: any): R;
      toHaveLength(expected: number): R;
      toBeGreaterThan(expected: number): R;
      toBeLessThan(expected: number): R;
      toMatch(expected: string | RegExp): R;
      toBeDefined(): R;
      toBeNull(): R;
      toBeUndefined(): R;
      toBeTruthy(): R;
      toBeFalsy(): R;
    }
  }
}

// Jest globals
declare const describe: jest.Describe;
declare const it: jest.It;
declare const test: jest.It;
declare const expect: jest.Expect;
declare const beforeAll: jest.Lifecycle;
declare const afterAll: jest.Lifecycle;
declare const beforeEach: jest.Lifecycle;
declare const afterEach: jest.Lifecycle;
declare const jest: jest.Jest;

export {};

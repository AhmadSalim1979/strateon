// Jest type declarations for test globals
// These supplement @types/jest for the test environment
declare namespace jest {
  type Lifecycle = (fn: () => void | Promise<void>, timeout?: number) => void;
  interface Describe { (name: string, fn: () => void): void; }
  interface It { (name: string, fn: () => void | Promise<void>, timeout?: number): void; }
}

declare const describe: jest.Describe;
declare const it: jest.It;
declare const test: jest.It;
declare const before: jest.Lifecycle;
declare const after: jest.Lifecycle;
declare const beforeEach: jest.Lifecycle;
declare const afterEach: jest.Lifecycle;
declare const expect: jest.Expect;
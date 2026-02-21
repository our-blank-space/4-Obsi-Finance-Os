export const Notice = jest.fn();
export const requestUrl = jest.fn(() => Promise.resolve({ json: {} }));
export const normalizePath = (path: string) => path;
export const TFile = class {};
export const Platform = { isMobile: false };
export const debounce = (fn: Function) => fn;

export default {
  Notice,
  requestUrl,
  normalizePath,
  TFile,
  Platform,
  debounce
};
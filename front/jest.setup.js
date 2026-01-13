const { getComputedStyle } = window;
window.getComputedStyle = elt => getComputedStyle(elt);

window.fetch = () => Promise.resolve();

window.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
};

// https://stackoverflow.com/questions/39830580/jest-test-fails-typeerror-window-matchmedia-is-not-a-function
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
});

window.URL.createObjectURL = jest.fn();

// Mock Vite environment variables for tests
// The Babel plugin transforms import.meta.env to process.env
// Vite normally sets DEV and PROD automatically, but in Jest we need to set them manually
// In tests, we're typically in development mode, so DEV=true and PROD=false
if (process.env.DEV === undefined) {
  process.env.DEV = "true";
}
if (process.env.PROD === undefined) {
  process.env.PROD = "false";
}
// Set a default API endpoint for tests if not provided
if (!process.env.VITE_API_ENDPOINT) {
  process.env.VITE_API_ENDPOINT = "http://api.td.local";
}

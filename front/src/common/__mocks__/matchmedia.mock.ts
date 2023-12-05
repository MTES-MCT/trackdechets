export const mockMatchMediaWidth = (width: number) => {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: width
  });
  window.matchMedia = jest.fn().mockImplementation(query => {
    return {
      matches: width < 1000 ? true : false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn()
    };
  });

  return { width };
};

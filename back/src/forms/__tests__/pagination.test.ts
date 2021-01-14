import { getConnectionsArgs } from "../pagination";

describe("getConnectionArgs", () => {
  it("should default to forward pagination if no arguments is provided", () => {
    const args = getConnectionsArgs({ defaultPaginateBy: 100 });
    expect(args).toEqual({ take: 100 });
  });
  it("should default to forward pagination if only `skip` is provided", () => {
    const args = getConnectionsArgs({ defaultPaginateBy: 100, skip: 2 });
    expect(args).toEqual({ take: 100, skip: 2 });
  });
  it("should set default value to `first` if cursorAfter is provided", () => {
    const args = getConnectionsArgs({
      cursorAfter: "after",
      defaultPaginateBy: 100
    });
    expect(args).toEqual({ take: 100, skip: 1, cursor: { id: "after" } });
  });
  it("should set default value to `last` if cursorBefore is provided", () => {
    const args = getConnectionsArgs({
      cursorBefore: "before",
      defaultPaginateBy: 100
    });
    expect(args).toEqual({ take: -100, skip: 1, cursor: { id: "before" } });
  });
  it.each(["first", "last"])(
    "should throw a validation error if %p is not an integer",
    p => {
      const shouldThrow = () =>
        getConnectionsArgs({
          [p]: 1.2
        });
      expect(shouldThrow).toThrow(`\`${p}\` doit être un entier`);
    }
  );
  it.each(["first", "last"])(
    "should throw a validation error if %p is not positive",
    p => {
      const shouldThrow = () =>
        getConnectionsArgs({
          [p]: -1
        });
      expect(shouldThrow).toThrow(`\`${p}\` doit être positif`);
    }
  );
  it.each(["first", "last"])(
    "should throw a validation error if %p is higher than max value allowed",
    p => {
      const shouldThrow = () =>
        getConnectionsArgs({
          [p]: 11,
          maxPaginateBy: 10
        });
      expect(shouldThrow).toThrow(`\`${p}\` doit être inférieur à 10`);
    }
  );
  it("should throw an error when passing both `first` and `last`", () => {
    const shouldThrow = () => getConnectionsArgs({ first: 10, last: 10 });
    expect(shouldThrow).toThrow(
      "L'utilisation simultanée de `first` et `last` n'est pas supportée"
    );
  });

  it("should throw an error when passing both `cursorAfter` and `cursorBefore`", () => {
    const shouldThrow = () =>
      getConnectionsArgs({ cursorAfter: "after", cursorBefore: "before" });
    expect(shouldThrow).toThrow(
      "L'utilisation simultanée de `cursorAfter` et `cursorBefore` n'est pas supportée"
    );
  });
  it("should throw error when passing `first` with `cursorBefore`", () => {
    const shouldThrow = () =>
      getConnectionsArgs({ first: 10, cursorBefore: "before" });
    expect(shouldThrow).toThrow(
      "`first` ne peut pas être utilisé en conjonction avec `cursorBefore`"
    );
  });
  it("should throw error when passing `last` with `cursorAfter`", () => {
    const shouldThrow = () =>
      getConnectionsArgs({ last: 10, cursorAfter: "after" });
    expect(shouldThrow).toThrow(
      "`last` ne peut pas être utilisé en conjonction avec `cursorAfter`"
    );
  });
  it.each(["cursorAfter", "cursorBefore"])(
    "should throw a validation error if skip is used in conjunction with %p",
    p => {
      const shouldThrow = () =>
        getConnectionsArgs({
          [p]: 10,
          skip: 10
        });
      expect(shouldThrow).toThrow(
        "`skip` (pagination par offset) ne peut pas être utilisé en conjonction avec `cursorAfter` ou `cursorBefore` (pagination par curseur)"
      );
    }
  );
});

import { getPrismaPaginationArgs } from "../pagination";

describe("getPrismaPaginationArgs", () => {
  it("should default to forward pagination if no arguments is provided", () => {
    const args = getPrismaPaginationArgs({ defaultPaginateBy: 100 });
    expect(args).toEqual({ take: 100 });
  });
  it("should default to forward pagination if only `skip` is provided", () => {
    const args = getPrismaPaginationArgs({ defaultPaginateBy: 100, skip: 2 });
    expect(args).toEqual({ take: 100, skip: 2 });
  });
  it("should set default value to `first` if cursorAfter is provided", () => {
    const args = getPrismaPaginationArgs({
      after: "after",
      defaultPaginateBy: 100
    });
    expect(args).toEqual({ take: 100, skip: 1, cursor: { id: "after" } });
  });
  it("should set default value to `last` if cursorBefore is provided", () => {
    const args = getPrismaPaginationArgs({
      before: "before",
      defaultPaginateBy: 100
    });
    expect(args).toEqual({ take: -100, skip: 1, cursor: { id: "before" } });
  });
  it.each(["first", "last"])(
    "should throw a validation error if %p is not an integer",
    p => {
      const shouldThrow = () =>
        getPrismaPaginationArgs({
          [p]: 1.2
        });
      expect(shouldThrow).toThrow(`\`${p}\` doit être un entier`);
    }
  );
  it.each(["first", "last"])(
    "should throw a validation error if %p is not positive",
    p => {
      const shouldThrow = () =>
        getPrismaPaginationArgs({
          [p]: -1
        });
      expect(shouldThrow).toThrow(`\`${p}\` doit être positif`);
    }
  );
  it.each(["first", "last"])(
    "should throw a validation error if %p is higher than max value allowed",
    p => {
      const shouldThrow = () =>
        getPrismaPaginationArgs({
          [p]: 11,
          maxPaginateBy: 10
        });
      expect(shouldThrow).toThrow(`\`${p}\` doit être inférieur à 10`);
    }
  );
  it("should throw an error when passing both `first` and `last`", () => {
    const shouldThrow = () => getPrismaPaginationArgs({ first: 10, last: 10 });
    expect(shouldThrow).toThrow(
      "L'utilisation simultanée de `first` et `last` n'est pas supportée"
    );
  });

  it("should throw an error when passing both `cursorAfter` and `cursorBefore`", () => {
    const shouldThrow = () =>
      getPrismaPaginationArgs({ after: "after", before: "before" });
    expect(shouldThrow).toThrow(
      "L'utilisation simultanée de `after` et `before` n'est pas supportée"
    );
  });
  it("should throw error when passing `first` with `cursorBefore`", () => {
    const shouldThrow = () =>
      getPrismaPaginationArgs({ first: 10, before: "before" });
    expect(shouldThrow).toThrow(
      "`first` ne peut pas être utilisé en conjonction avec `before`"
    );
  });
  it("should throw error when passing `last` with `cursorAfter`", () => {
    const shouldThrow = () =>
      getPrismaPaginationArgs({ last: 10, after: "after" });
    expect(shouldThrow).toThrow(
      "`last` ne peut pas être utilisé en conjonction avec `after`"
    );
  });
  it.each(["after", "before"])(
    "should throw a validation error if skip is used in conjunction with %p",
    p => {
      const shouldThrow = () =>
        getPrismaPaginationArgs({
          [p]: 10,
          skip: 10
        });
      expect(shouldThrow).toThrow(
        "`skip` (pagination par offset) ne peut pas être utilisé en conjonction avec `after` ou `before` (pagination par curseur)"
      );
    }
  );
});

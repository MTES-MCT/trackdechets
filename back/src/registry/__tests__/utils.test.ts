import { displayWasteQuantity } from "../utils";

describe("displayWasteQuantity", () => {
  it.each([
    [10, "10 tonne(s)"],
    [0, "0 tonne(s)"],
    [0.654654, "0.654654 tonne(s)"],
    [null, "Non renseignée"],
    [undefined, "Non renseignée"]
  ])("%p should be displayed as %p", (input, expected) => {
    // When
    const res = displayWasteQuantity(input);

    // Then
    expect(res).toEqual(expected);
  });
});

import { BsffPackagingType } from "@td/codegen-ui";
import { ZodBsffGroupingOrForwarding } from "../schema";
import { toggleRepackagingSelection } from "./BsffSelectableWasteTableWrapper";

const createPackaging = (id: string): ZodBsffGroupingOrForwarding => ({
  id,
  numero: id,
  type: BsffPackagingType.Bouteille,
  bsff: {}
});

describe("toggleRepackagingSelection", () => {
  const first = createPackaging("first");
  const second = createPackaging("second");

  it("adds a source packaging without mutating the current selection", () => {
    const selected = [first];

    expect(toggleRepackagingSelection(selected, second)).toEqual([
      first,
      second
    ]);
    expect(selected).toEqual([first]);
  });

  it("removes an already selected source packaging", () => {
    expect(toggleRepackagingSelection([first, second], first)).toEqual([
      second
    ]);
  });
});

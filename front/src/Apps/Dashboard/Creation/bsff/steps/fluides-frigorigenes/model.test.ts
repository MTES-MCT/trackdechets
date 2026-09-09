import { fluidesFrigorigenesInterventionsFixture } from "./fixtures";
import {
  filterInterventions,
  getSelectedWasteCode,
  isInterventionSelectable
} from "./model";

describe("Fluides Frigorigènes business rules", () => {
  it("filters independently by waste code, holder and association", () => {
    expect(
      filterInterventions(fluidesFrigorigenesInterventionsFixture, {
        wasteCodes: ["14 06 02*"],
        equipmentHolders: ["Leclerc Millau"],
        association: ["yes"]
      }).map(({ id }) => id)
    ).toEqual(["fi-3"]);
    expect(
      filterInterventions(fluidesFrigorigenesInterventionsFixture, {
        wasteCodes: [],
        equipmentHolders: [],
        association: ["no"]
      }).map(({ id }) => id)
    ).toEqual(["fi-1", "fi-2"]);
  });

  it("locks selection to the waste code of the first selected intervention", () => {
    const code = getSelectedWasteCode(fluidesFrigorigenesInterventionsFixture, [
      "fi-2"
    ]);
    expect(
      isInterventionSelectable(fluidesFrigorigenesInterventionsFixture[0], code)
    ).toBe(false);
    expect(
      isInterventionSelectable(fluidesFrigorigenesInterventionsFixture[2], code)
    ).toBe(true);
  });

  it("resets the constraint when selection is empty", () => {
    const code = getSelectedWasteCode(
      fluidesFrigorigenesInterventionsFixture,
      []
    );
    expect(
      isInterventionSelectable(fluidesFrigorigenesInterventionsFixture[0], code)
    ).toBe(true);
  });
});

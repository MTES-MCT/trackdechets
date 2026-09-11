import { fluidesFrigorigenesInterventionsFixture } from "./fixtures";
import {
  filterInterventions,
  getSelectedWasteCodes,
  isInterventionSelectable
} from "./model";

describe("Fluides Frigorigènes business rules", () => {
  it("automatically excludes associated interventions before applying filters", () => {
    expect(
      filterInterventions(fluidesFrigorigenesInterventionsFixture, {
        wasteCodes: ["14 06 02*"],
        equipmentHolders: []
      }).map(({ id }) => id)
    ).toEqual(["fi-2"]);
    expect(
      filterInterventions(fluidesFrigorigenesInterventionsFixture, {
        wasteCodes: [],
        equipmentHolders: []
      }).map(({ id }) => id)
    ).toEqual(["fi-1", "fi-2"]);
  });

  it("locks selection to the waste code of the first selected intervention", () => {
    const codes = getSelectedWasteCodes(
      fluidesFrigorigenesInterventionsFixture,
      ["fi-2"]
    );
    expect(
      isInterventionSelectable(
        fluidesFrigorigenesInterventionsFixture[0],
        codes
      )
    ).toBe(false);
    expect(
      isInterventionSelectable(
        fluidesFrigorigenesInterventionsFixture[2],
        codes
      )
    ).toBe(true);
  });

  it("resets the constraint when selection is empty", () => {
    const codes = getSelectedWasteCodes(
      fluidesFrigorigenesInterventionsFixture,
      []
    );
    expect(
      isInterventionSelectable(
        fluidesFrigorigenesInterventionsFixture[0],
        codes
      )
    ).toBe(true);
  });
});

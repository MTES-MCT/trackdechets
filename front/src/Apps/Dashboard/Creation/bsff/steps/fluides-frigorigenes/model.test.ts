import { mockFluidesFrigorigenesInterventions } from "./mockData";
import {
  filterInterventions,
  getSelectedWasteCode,
  isInterventionSelectable
} from "./model";

describe("Fluides Frigorigènes business rules", () => {
  it("filters independently by waste code, holder and association", () => {
    expect(
      filterInterventions(mockFluidesFrigorigenesInterventions, {
        wasteCodes: ["14 06 02*"],
        equipmentHolders: ["Leclerc Millau"],
        association: ["yes"]
      }).map(({ id }) => id)
    ).toEqual(["fi-3"]);
    expect(
      filterInterventions(mockFluidesFrigorigenesInterventions, {
        wasteCodes: [],
        equipmentHolders: [],
        association: ["no"]
      }).map(({ id }) => id)
    ).toEqual(["fi-1", "fi-2"]);
  });

  it("locks selection to the waste code of the first selected intervention", () => {
    const code = getSelectedWasteCode(mockFluidesFrigorigenesInterventions, [
      "fi-2"
    ]);
    expect(
      isInterventionSelectable(mockFluidesFrigorigenesInterventions[0], code)
    ).toBe(false);
    expect(
      isInterventionSelectable(mockFluidesFrigorigenesInterventions[2], code)
    ).toBe(true);
  });

  it("resets the constraint when selection is empty", () => {
    const code = getSelectedWasteCode(mockFluidesFrigorigenesInterventions, []);
    expect(
      isInterventionSelectable(mockFluidesFrigorigenesInterventions[0], code)
    ).toBe(true);
  });
});

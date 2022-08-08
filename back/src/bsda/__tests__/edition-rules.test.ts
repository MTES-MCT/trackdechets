import { Bsda, BsdaType } from "@prisma/client";
import { SealedFieldsError } from "../../bsvhu/errors";
import { checkKeysEditability } from "../edition-rules";

type BsdaWithGrouping = Bsda & { grouping: Bsda[] };
describe("Bsda edition rules", () => {
  it("should allow edits before signature", () => {
    expect(() =>
      checkKeysEditability({ type: BsdaType.GATHERING }, {} as BsdaWithGrouping)
    ).not.toThrow();
  });

  it("should throw if trying to edit a sealed field", () => {
    expect(() =>
      checkKeysEditability({ type: BsdaType.GATHERING }, {
        emitterEmissionSignatureDate: new Date()
      } as BsdaWithGrouping)
    ).toThrow(SealedFieldsError);
  });

  it("should throw if trying to edit a field sealed not by the required signature type but by a child signature type", () => {
    expect(() =>
      checkKeysEditability({ type: BsdaType.GATHERING }, {
        destinationOperationSignatureDate: new Date()
      } as BsdaWithGrouping)
    ).toThrow(SealedFieldsError);
  });

  it("should throw with the flat field path when erroring", () => {
    expect.assertions(1);
    try {
      checkKeysEditability({ type: BsdaType.GATHERING }, {
        emitterEmissionSignatureDate: new Date()
      } as BsdaWithGrouping);
    } catch (err) {
      expect(err.message).toBe(
        "Des champs ont été vérouillés via signature et ne peuvent plus être modifiés: type"
      );
    }
  });

  it("should throw with the exact path when erroring on a level 0 rule", () => {
    expect.assertions(1);
    try {
      checkKeysEditability({ emitter: { company: { mail: "edit@td.com" } } }, {
        emitterEmissionSignatureDate: new Date()
      } as BsdaWithGrouping);
    } catch (err) {
      expect(err.message).toBe(
        "Des champs ont été vérouillés via signature et ne peuvent plus être modifiés: emitter.company.mail"
      );
    }
  });

  it("should throw with the exact deep path when erroring on a level 1 rule", () => {
    expect.assertions(1);
    try {
      checkKeysEditability(
        { destination: { company: { mail: "edit@td.com" } } },
        {
          emitterEmissionSignatureDate: new Date()
        } as BsdaWithGrouping
      );
    } catch (err) {
      expect(err.message).toBe(
        "Des champs ont été vérouillés via signature et ne peuvent plus être modifiés: destination.company.mail"
      );
    }
  });
});

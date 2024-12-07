import { companyFactory } from "../../__tests__/factories";
import { WasteMap } from "../converters";
import { addCompaniesGivenNames } from "../wastes";
import type { AllWaste } from "@td/codegen-back";
import { GenericWaste } from "../types";
import { resetDatabase } from "../../../integration-tests/helper";
import { Company } from "@prisma/client";

function cloneWaste<WasteType extends GenericWaste>(obj): WasteType {
  return JSON.parse(JSON.stringify(obj)) as WasteType;
}

describe("addCompaniesGivenNames", () => {
  afterAll(resetDatabase);

  let emitter: Company;
  let destination: Company;
  let transporter: Company;
  let transporter2: Company;
  let transporter3: Company;
  let transporter4: Company;
  let transporter5: Company;

  beforeAll(async () => {
    emitter = await companyFactory({
      givenName: "Emitter given name!"
    });
    destination = await companyFactory({
      givenName: "Destination given name!"
    });
    transporter = await companyFactory({
      givenName: "Transporter given name!"
    });
    transporter2 = await companyFactory({
      givenName: "Transporter2 given name!"
    });
    transporter3 = await companyFactory({
      givenName: "Transporter3 given name!"
    });
    transporter4 = await companyFactory({
      givenName: "Transporter4 given name!"
    });
    transporter5 = await companyFactory({
      givenName: "Transporter5 given name!"
    });
  });

  it("should add companies given names", async () => {
    // Given
    const waste = {
      emitterCompanySiret: emitter.siret,
      destinationCompanySiret: destination.siret,
      transporterCompanySiret: transporter.siret,
      transporter2CompanySiret: transporter2.siret,
      transporter3CompanySiret: transporter3.siret,
      transporter4CompanySiret: transporter4.siret,
      transporter5CompanySiret: transporter5.siret
    };

    const wastes: WasteMap<AllWaste> = {
      BSDD: [cloneWaste(waste)],
      BSDA: [cloneWaste(waste)],
      BSFF: [cloneWaste(waste)],
      BSDASRI: [cloneWaste(waste)],
      BSVHU: [cloneWaste(waste)],
      BSPAOH: [cloneWaste(waste)]
    };

    // When
    const wastesWithGivenNames = await addCompaniesGivenNames(wastes);

    // Then
    ["BSDD", "BSDA", "BSFF", "BSDASRI", "BSVHU", "BSPAOH"].forEach(
      wasteType => {
        expect(wastesWithGivenNames[wasteType][0].emitterCompanyGivenName).toBe(
          emitter.givenName
        );
        expect(
          wastesWithGivenNames[wasteType][0].destinationCompanyGivenName
        ).toBe(destination.givenName);
        expect(
          wastesWithGivenNames[wasteType][0].transporterCompanyGivenName
        ).toBe(transporter.givenName);
        expect(
          wastesWithGivenNames[wasteType][0].transporter2CompanyGivenName
        ).toBe(transporter2.givenName);
        expect(
          wastesWithGivenNames[wasteType][0].transporter3CompanyGivenName
        ).toBe(transporter3.givenName);
        expect(
          wastesWithGivenNames[wasteType][0].transporter4CompanyGivenName
        ).toBe(transporter4.givenName);
        expect(
          wastesWithGivenNames[wasteType][0].transporter5CompanyGivenName
        ).toBe(transporter5.givenName);
      }
    );
  });

  it("should add companies given names even if company has vatNumber, not siret", async () => {
    // Given
    const foreignTransporter = await companyFactory({
      vatNumber: "BE000000001",
      givenName: "Foreign transporter given name!"
    });
    const waste = {
      transporterCompanySiret: foreignTransporter.vatNumber
    };

    const wastes: WasteMap<AllWaste> = {
      BSDD: [cloneWaste(waste)],
      BSDA: [cloneWaste(waste)],
      BSFF: [cloneWaste(waste)],
      BSDASRI: [cloneWaste(waste)],
      BSVHU: [cloneWaste(waste)],
      BSPAOH: [cloneWaste(waste)]
    };

    // When
    const wastesWithGivenNames = await addCompaniesGivenNames(wastes);

    // Then
    ["BSDD", "BSDA", "BSFF", "BSDASRI", "BSVHU", "BSPAOH"].forEach(
      wasteType => {
        expect(
          wastesWithGivenNames[wasteType][0].transporterCompanyGivenName
        ).toBe(foreignTransporter.givenName);
      }
    );
  });

  it("should add companies given names - test with multiple wastes per wasteType", async () => {
    // Given
    const waste = {
      emitterCompanySiret: emitter.siret,
      destinationCompanySiret: destination.siret,
      transporterCompanySiret: transporter.siret,
      transporter2CompanySiret: transporter2.siret,
      transporter3CompanySiret: transporter3.siret,
      transporter4CompanySiret: transporter4.siret,
      transporter5CompanySiret: transporter5.siret
    };

    const wastes: WasteMap<AllWaste> = {
      BSDD: [cloneWaste(waste), cloneWaste(waste), cloneWaste(waste)],
      BSDA: [cloneWaste(waste), cloneWaste(waste), cloneWaste(waste)],
      BSFF: [cloneWaste(waste), cloneWaste(waste), cloneWaste(waste)],
      BSDASRI: [cloneWaste(waste), cloneWaste(waste), cloneWaste(waste)],
      BSVHU: [cloneWaste(waste), cloneWaste(waste), cloneWaste(waste)],
      BSPAOH: [cloneWaste(waste), cloneWaste(waste), cloneWaste(waste)]
    };

    // When
    const wastesWithGivenNames = await addCompaniesGivenNames(wastes);

    // Then
    ["BSDD", "BSDA", "BSFF", "BSDASRI", "BSVHU", "BSPAOH"].forEach(
      wasteType => {
        [0, 1, 2].forEach(index => {
          expect(
            wastesWithGivenNames[wasteType][index].emitterCompanyGivenName
          ).toBe(emitter.givenName);
          expect(
            wastesWithGivenNames[wasteType][index].destinationCompanyGivenName
          ).toBe(destination.givenName);
          expect(
            wastesWithGivenNames[wasteType][index].transporterCompanyGivenName
          ).toBe(transporter.givenName);
          expect(
            wastesWithGivenNames[wasteType][index].transporter2CompanyGivenName
          ).toBe(transporter2.givenName);
          expect(
            wastesWithGivenNames[wasteType][index].transporter3CompanyGivenName
          ).toBe(transporter3.givenName);
          expect(
            wastesWithGivenNames[wasteType][index].transporter4CompanyGivenName
          ).toBe(transporter4.givenName);
          expect(
            wastesWithGivenNames[wasteType][index].transporter5CompanyGivenName
          ).toBe(transporter5.givenName);
        });
      }
    );
  });

  it("should do nothing if siret is empty", async () => {
    // Given
    const waste = {
      emitterCompanySiret: null,
      destinationCompanySiret: null,
      transporterCompanySiret: null,
      transporter2CompanySiret: null,
      transporter3CompanySiret: null,
      transporter4CompanySiret: null,
      transporter5CompanySiret: null
    };

    const wastes: WasteMap<AllWaste> = {
      BSDD: [cloneWaste(waste)],
      BSDA: [cloneWaste(waste)],
      BSFF: [cloneWaste(waste)],
      BSDASRI: [cloneWaste(waste)],
      BSVHU: [cloneWaste(waste)],
      BSPAOH: [cloneWaste(waste)]
    };

    // When
    const wastesWithGivenNames = await addCompaniesGivenNames(wastes);

    // Then
    ["BSDD", "BSDA", "BSFF", "BSDASRI", "BSVHU", "BSPAOH"].forEach(
      wasteType => {
        expect(
          wastesWithGivenNames[wasteType][0].emitterCompanyGivenName
        ).toBeUndefined();
        expect(
          wastesWithGivenNames[wasteType][0].destinationCompanyGivenName
        ).toBeUndefined();
        expect(
          wastesWithGivenNames[wasteType][0].transporterCompanyGivenName
        ).toBeUndefined();
        expect(
          wastesWithGivenNames[wasteType][0].transporter2CompanyGivenName
        ).toBeUndefined();
        expect(
          wastesWithGivenNames[wasteType][0].transporter3CompanyGivenName
        ).toBeUndefined();
        expect(
          wastesWithGivenNames[wasteType][0].transporter4CompanyGivenName
        ).toBeUndefined();
        expect(
          wastesWithGivenNames[wasteType][0].transporter5CompanyGivenName
        ).toBeUndefined();
      }
    );
  });

  it("should fill given names only if siret is present", async () => {
    // Given
    const waste = {
      emitterCompanySiret: emitter.siret,
      destinationCompanySiret: null,
      transporterCompanySiret: transporter.siret,
      transporter2CompanySiret: undefined,
      transporter3CompanySiret: transporter3.siret,
      // transporter4CompanySiret > Field is absent
      transporter5CompanySiret: ""
    };

    const wastes: WasteMap<AllWaste> = {
      BSDD: [cloneWaste(waste)],
      BSDA: [cloneWaste(waste)],
      BSFF: [cloneWaste(waste)],
      BSDASRI: [cloneWaste(waste)],
      BSVHU: [cloneWaste(waste)],
      BSPAOH: [cloneWaste(waste)]
    };

    // When
    const wastesWithGivenNames = await addCompaniesGivenNames(wastes);

    // Then
    ["BSDD", "BSDA", "BSFF", "BSDASRI", "BSVHU", "BSPAOH"].forEach(
      wasteType => {
        expect(wastesWithGivenNames[wasteType][0].emitterCompanyGivenName).toBe(
          emitter.givenName
        );
        expect(
          wastesWithGivenNames[wasteType][0].destinationCompanyGivenName
        ).toBeUndefined();
        expect(
          wastesWithGivenNames[wasteType][0].transporterCompanyGivenName
        ).toBe(transporter.givenName);
        expect(
          wastesWithGivenNames[wasteType][0].transporter2CompanyGivenName
        ).toBeUndefined();
        expect(
          wastesWithGivenNames[wasteType][0].transporter3CompanyGivenName
        ).toBe(transporter3.givenName);
        expect(
          wastesWithGivenNames[wasteType][0].transporter4CompanyGivenName
        ).toBeUndefined();
        expect(
          wastesWithGivenNames[wasteType][0].transporter5CompanyGivenName
        ).toBeUndefined();
      }
    );
  });

  it("edge-cases", async () => {
    // Given
    const waste = {
      emitterCompanySiret: emitter.siret,
      destinationCompanySiret: null,
      transporterCompanySiret: transporter.siret,
      transporter2CompanySiret: undefined,
      transporter3CompanySiret: transporter3.siret,
      // transporter4CompanySiret > Field is absent
      transporter5CompanySiret: ""
    };

    const wastes: WasteMap<AllWaste> = {
      BSDD: [],
      BSDA: [{}],
      BSFF: [cloneWaste(waste), {}],
      BSDASRI: [cloneWaste(waste)],
      BSVHU: [{}, cloneWaste(waste)],
      BSPAOH: []
    };

    // When
    const wastesWithGivenNames = await addCompaniesGivenNames(wastes);

    // Then
    expect(wastesWithGivenNames.BSDD.length).toBe(0);
    expect(wastesWithGivenNames.BSDA[0]).toStrictEqual({});

    expect(wastesWithGivenNames.BSFF[0].emitterCompanyGivenName).toBe(
      emitter.givenName
    );
    expect(
      wastesWithGivenNames.BSFF[0].destinationCompanyGivenName
    ).toBeUndefined();
    expect(wastesWithGivenNames.BSFF[0].transporterCompanyGivenName).toBe(
      transporter.givenName
    );
    expect(
      wastesWithGivenNames.BSFF[0].transporter2CompanyGivenName
    ).toBeUndefined();
    expect(wastesWithGivenNames.BSFF[0].transporter3CompanyGivenName).toBe(
      transporter3.givenName
    );
    expect(
      wastesWithGivenNames.BSFF[0].transporter4CompanyGivenName
    ).toBeUndefined();
    expect(
      wastesWithGivenNames.BSFF[0].transporter5CompanyGivenName
    ).toBeUndefined();
    expect(wastesWithGivenNames.BSFF[1]).toStrictEqual({});

    expect(wastesWithGivenNames.BSDASRI[0].emitterCompanyGivenName).toBe(
      emitter.givenName
    );
    expect(
      wastesWithGivenNames.BSDASRI[0].destinationCompanyGivenName
    ).toBeUndefined();
    expect(wastesWithGivenNames.BSDASRI[0].transporterCompanyGivenName).toBe(
      transporter.givenName
    );
    expect(
      wastesWithGivenNames.BSDASRI[0].transporter2CompanyGivenName
    ).toBeUndefined();
    expect(wastesWithGivenNames.BSDASRI[0].transporter3CompanyGivenName).toBe(
      transporter3.givenName
    );
    expect(
      wastesWithGivenNames.BSDASRI[0].transporter4CompanyGivenName
    ).toBeUndefined();
    expect(
      wastesWithGivenNames.BSDASRI[0].transporter5CompanyGivenName
    ).toBeUndefined();

    expect(wastesWithGivenNames.BSVHU[0]).toStrictEqual({});
    expect(wastesWithGivenNames.BSVHU[1].emitterCompanyGivenName).toBe(
      emitter.givenName
    );
    expect(
      wastesWithGivenNames.BSVHU[1].destinationCompanyGivenName
    ).toBeUndefined();
    expect(wastesWithGivenNames.BSVHU[1].transporterCompanyGivenName).toBe(
      transporter.givenName
    );
    expect(
      wastesWithGivenNames.BSVHU[1].transporter2CompanyGivenName
    ).toBeUndefined();
    expect(wastesWithGivenNames.BSVHU[1].transporter3CompanyGivenName).toBe(
      transporter3.givenName
    );
    expect(
      wastesWithGivenNames.BSVHU[1].transporter4CompanyGivenName
    ).toBeUndefined();
    expect(
      wastesWithGivenNames.BSVHU[1].transporter5CompanyGivenName
    ).toBeUndefined();

    expect(wastesWithGivenNames.BSPAOH.length).toBe(0);
  });
});

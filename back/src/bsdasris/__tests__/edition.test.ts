import { Bsdasri } from "@prisma/client";
import {
  BsdasriAcceptationInput,
  BsdasriDestinationInput,
  BsdasriEmissionInput,
  BsdasriEmitterInput,
  BsdasriIdentificationInput,
  BsdasriInput,
  BsdasriOperationInput,
  BsdasriPackagingsInput,
  BsdasriRecepisseInput,
  BsdasriReceptionInput,
  BsdasriTransporterInput,
  BsdasriTransportInput,
  BsdasriWeightInput,
  CompanyInput,
  EcoOrganismeInput,
  PickupSiteInput
} from "../../generated/graphql/types";
import { flattenBsdasriInput } from "../converter";
import { editionRules, isAwaitingSignature } from "../edition";

describe("edition", () => {
  test("an edition rule should be defined for every key in BsdaInput", () => {
    // Create a dummy BSDASRI input where every possible key is present
    // The typing will break whenever a field is added or modified
    // to BsdasriInput input so that we think of adding an entry to the edition rules
    const company: Required<CompanyInput> = {
      siret: "",
      name: "",
      address: "",
      mail: "",
      contact: "",
      phone: "",
      country: "",
      omiNumber: "",
      vatNumber: "",
      extraEuropeanId: ""
    };

    const recepisse: Required<
      Omit<BsdasriRecepisseInput, "number" | "department" | "validityLimit">
    > = {
      isExempted: false
    };

    const packaging: Required<BsdasriPackagingsInput> = {
      type: "BOITE_CARTON",
      quantity: 1,
      volume: 1,
      other: ""
    };

    const emission: Required<BsdasriEmissionInput> = {
      weight: {
        value: 1,
        isEstimate: false
      },
      packagings: [packaging]
    };

    const pickupSite: Required<PickupSiteInput> = {
      address: "",
      city: "",
      postalCode: "",
      infos: "",
      name: ""
    };

    const emitter: Required<BsdasriEmitterInput> = {
      company,
      emission,
      customInfo: "",
      pickupSite
    };

    const acceptation: Required<BsdasriAcceptationInput> = {
      status: "ACCEPTED",
      refusalReason: "",
      refusedWeight: 1
    };

    const reception: Required<BsdasriReceptionInput> = {
      acceptation,
      volume: 1,
      packagings: [packaging],
      date: new Date("2021-04-27")
    };

    const operation: Required<BsdasriOperationInput> = {
      weight: {
        value: 1
      },
      code: "D10",
      mode: "ELIMINATION",
      date: new Date("2020-04-28")
    };

    const destination: Required<BsdasriDestinationInput> = {
      company,
      reception,
      operation,
      customInfo: ""
    };

    const weight: Required<BsdasriWeightInput> = {
      value: 1,
      isEstimate: false
    };

    const transport: Required<BsdasriTransportInput> = {
      acceptation,
      weight,
      packagings: [packaging],
      takenOverAt: new Date(),
      handedOverAt: new Date(),
      plates: [],
      mode: "ROAD"
    };

    const transporter: Required<BsdasriTransporterInput> = {
      company,
      recepisse,
      transport,
      customInfo: ""
    };

    const ecoOrganisme: Required<EcoOrganismeInput> = { name: "", siret: "" };

    const identification: Required<BsdasriIdentificationInput> = {
      numbers: []
    };

    const input: Required<BsdasriInput> = {
      waste: {
        code: "",
        adr: ""
      },
      emitter,
      destination,
      transporter,
      ecoOrganisme,
      identification,
      grouping: [],
      synthesizing: []
    };

    const flatInput = flattenBsdasriInput(input);
    for (const key of Object.keys(flatInput)) {
      expect(Object.keys(editionRules)).toContain(key);
    }
  });

  test("isAwaitingSignature should recursively checks the signature hierarchy", () => {
    const bsdasri = {
      emitterEmissionSignatureDate: null,
      transporterTransportSignatureDate: null,
      destinationReceptionSignatureDate: null,
      destinationOperationSignatureDate: null
    } as Bsdasri;
    expect(isAwaitingSignature("EMISSION", bsdasri)).toEqual(true);
    expect(isAwaitingSignature("TRANSPORT", bsdasri)).toEqual(true);
    expect(isAwaitingSignature("RECEPTION", bsdasri)).toEqual(true);
    expect(isAwaitingSignature("OPERATION", bsdasri)).toEqual(true);
    const afterEmission = {
      ...bsdasri,
      emitterEmissionSignatureDate: new Date()
    };
    expect(isAwaitingSignature("EMISSION", afterEmission)).toEqual(false);
    expect(isAwaitingSignature("TRANSPORT", afterEmission)).toEqual(true);
    expect(isAwaitingSignature("RECEPTION", afterEmission)).toEqual(true);
    expect(isAwaitingSignature("OPERATION", afterEmission)).toEqual(true);

    const afterTransport = {
      ...afterEmission,
      transporterTransportSignatureDate: new Date()
    };
    expect(isAwaitingSignature("EMISSION", afterTransport)).toEqual(false);
    expect(isAwaitingSignature("TRANSPORT", afterTransport)).toEqual(false);
    expect(isAwaitingSignature("RECEPTION", afterTransport)).toEqual(true);
    expect(isAwaitingSignature("OPERATION", afterTransport)).toEqual(true);
    const afterReception = {
      ...afterTransport,
      destinationReceptionSignatureDate: new Date()
    };
    expect(isAwaitingSignature("EMISSION", afterReception)).toEqual(false);
    expect(isAwaitingSignature("TRANSPORT", afterReception)).toEqual(false);
    expect(isAwaitingSignature("RECEPTION", afterReception)).toEqual(false);
    expect(isAwaitingSignature("OPERATION", afterReception)).toEqual(true);
    const afterOperation = {
      ...afterTransport,
      destinationOperationSignatureDate: new Date()
    };
    expect(isAwaitingSignature("EMISSION", afterOperation)).toEqual(false);
    expect(isAwaitingSignature("TRANSPORT", afterOperation)).toEqual(false);
    expect(isAwaitingSignature("RECEPTION", afterOperation)).toEqual(false);
    expect(isAwaitingSignature("OPERATION", afterOperation)).toEqual(false);
  });
});

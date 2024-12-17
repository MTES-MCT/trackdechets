import { resetDatabase } from "../../../../integration-tests/helper";
import {
  formFactory,
  userWithCompanyFactory
} from "../../../__tests__/factories";
import { CompanySearchResult } from "@td/codegen-back";
import { searchCompany } from "../../../companies/search";
import { sirenifyBsdd } from "../sirenifyBsd";
import { prisma } from "@td/prisma";

jest.mock("../../../companies/search");

describe("sirenifyBsdd", () => {
  afterEach(resetDatabase);

  test("it should sirenify BSDD", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const transporter = await userWithCompanyFactory("MEMBER");
    const recipient = await userWithCompanyFactory("MEMBER");
    const broker = await userWithCompanyFactory("MEMBER");
    const trader = await userWithCompanyFactory("MEMBER");
    const intermediary = await userWithCompanyFactory("MEMBER");

    function searchResult(companyName: string) {
      return {
        name: companyName,
        address: `Adresse ${companyName}`,
        statutDiffusionEtablissement: "O"
      } as CompanySearchResult;
    }

    const searchResults = {
      [emitter.company.siret!]: searchResult("émetteur"),
      [transporter.company.siret!]: searchResult("transporteur"),
      [recipient.company.siret!]: searchResult("destinataire"),
      [broker.company.siret!]: searchResult("courtier"),
      [trader.company.siret!]: searchResult("négociant"),
      [intermediary.company.siret!]: searchResult("intermédiaire 1")
    };

    (searchCompany as jest.Mock).mockImplementation((clue: string) => {
      return Promise.resolve(searchResults[clue]);
    });

    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        emitterCompanySiret: emitter.company.siret,
        recipientCompanySiret: recipient.company.siret,
        brokerCompanySiret: broker.company.siret,
        traderCompanySiret: trader.company.siret,
        intermediaries: {
          createMany: {
            data: {
              siret: intermediary.company!.siret!,
              name: intermediary.company!.name,
              contact: "contact"
            }
          }
        },
        transporters: {
          create: {
            transporterCompanySiret: transporter.company.siret,
            number: 1
          }
        }
      }
    });

    await sirenifyBsdd(form.readableId);

    const sirenified = await prisma.form.findUniqueOrThrow({
      where: { id: form.id },
      include: { transporters: true, intermediaries: true }
    });

    expect(sirenified.emitterCompanyAddress).toEqual(
      searchResults[emitter.company!.siret!].address
    );
    expect(sirenified.emitterCompanyName).toEqual(
      searchResults[emitter.company!.siret!].name
    );
    expect(sirenified.recipientCompanyAddress).toEqual(
      searchResults[recipient.company!.siret!].address
    );
    expect(sirenified.recipientCompanyName).toEqual(
      searchResults[recipient.company!.siret!].name
    );
    expect(sirenified.brokerCompanyAddress).toEqual(
      searchResults[broker.company!.siret!].address
    );
    expect(sirenified.brokerCompanyName).toEqual(
      searchResults[broker.company!.siret!].name
    );
    expect(sirenified.traderCompanyAddress).toEqual(
      searchResults[trader.company!.siret!].address
    );
    expect(sirenified.traderCompanyName).toEqual(
      searchResults[trader.company!.siret!].name
    );
    expect(sirenified.intermediaries[0].address).toEqual(
      searchResults[intermediary.company!.siret!].address
    );
    expect(sirenified.intermediaries[0].name).toEqual(
      searchResults[intermediary.company!.siret!].name
    );
    expect(sirenified.transporters[0].transporterCompanyAddress).toEqual(
      searchResults[transporter.company!.siret!].address
    );
    expect(sirenified.transporters[0].transporterCompanyName).toEqual(
      searchResults[transporter.company!.siret!].name
    );

    const {
      emitterCompanyAddress,
      emitterCompanyName,
      recipientCompanyAddress,
      recipientCompanyName,
      brokerCompanyAddress,
      brokerCompanyName,
      traderCompanyAddress,
      traderCompanyName,
      updatedAt,
      transporters,
      intermediaries,
      ...rest
    } = sirenified;

    for (const key of Object.keys(rest)) {
      // les autres données ne doivent pas être modifiées
      expect(rest[key]).toEqual(form[key]);
    }
  });
});

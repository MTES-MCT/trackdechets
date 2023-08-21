import {
  companyFactory,
  formFactory,
  formWithTempStorageFactory,
  siretify,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { AuthType } from "../../../../auth";
import { resetDatabase } from "../../../../../integration-tests/helper";
import prisma from "../../../../prisma";
import { Query } from "../../../../generated/graphql/types";
import getReadableId from "../../../../forms/readableId";
import * as search from "../../../search";
import { CompanySearchResult } from "../../../types";

const FAVORITES = `query Favorites($orgId: String!, $type: FavoriteType!) {
  favorites(orgId: $orgId, type: $type) {
    name
    orgId
    siret
    vatNumber
    address
    contact
    contactPhone
    contactMail
    codePaysEtrangerEtablissement
    transporterReceipt {
      receiptNumber
    }
    traderReceipt {
      receiptNumber
    }
    brokerReceipt {
      receiptNumber
    }
  }
}`;

const searchCompanySpy = jest.spyOn(search, "searchCompany");

describe("query favorites", () => {
  afterEach(resetDatabase);

  it("should not be possible to access favorites of other companies", async () => {
    const user = await userFactory();
    const { user: user2, company: company2 } = await userWithCompanyFactory(
      "MEMBER"
    );
    await formFactory({
      ownerId: user2.id,
      opt: { recipientCompanySiret: company2.orgId }
    });
    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { errors } = await query<Pick<Query, "favorites">>(FAVORITES, {
      variables: {
        orgId: company2.orgId,
        type: "RECIPIENT"
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: `Vous n'êtes pas membre de l'entreprise portant le orgId "${company2.orgId}".`
      })
    ]);
  });

  it("should not return favorites of other users", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const { user: user2, company: company2 } = await userWithCompanyFactory(
      "MEMBER"
    );
    await formFactory({
      ownerId: user2.id,
      opt: { recipientCompanySiret: company2.orgId }
    });
    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await query<Pick<Query, "favorites">>(FAVORITES, {
      variables: {
        orgId: company.orgId,
        type: "RECIPIENT"
      }
    });

    expect(data.favorites).toEqual([
      expect.objectContaining({ orgId: company.orgId })
    ]);
  });

  it("should ignore drafts", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["COLLECTOR"]
      }
    });
    await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT"
      }
    });

    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await query<Pick<Query, "favorites">>(FAVORITES, {
      variables: {
        orgId: company.orgId,
        type: "EMITTER"
      }
    });

    expect(data.favorites).toEqual([]);
  });

  it("should ignore deleted forms", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["COLLECTOR"]
      }
    });
    await formFactory({
      ownerId: user.id,
      opt: {
        isDeleted: true
      }
    });

    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await query<Pick<Query, "favorites">>(FAVORITES, {
      variables: {
        orgId: company.orgId,
        type: "EMITTER"
      }
    });

    expect(data.favorites).toEqual([]);
  });

  it("should return recent emitters", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["COLLECTOR"]
      }
    });
    const emitter = await companyFactory();
    await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: emitter.orgId,
        recipientCompanySiret: company.orgId,
        recipientsSirets: [company.orgId!]
      }
    });

    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await query<Pick<Query, "favorites">>(FAVORITES, {
      variables: {
        orgId: company.orgId,
        type: "EMITTER"
      }
    });

    expect(data.favorites).toEqual([
      expect.objectContaining({
        orgId: emitter.orgId,
        name: emitter.name,
        address: emitter.address,
        vatNumber: null,
        mail: emitter.contactEmail,
        phone: emitter.contactPhone,
        contact: emitter.contact,
        codePaysEtrangerEtablissement: "FR"
      })
    ]);
  });

  it("should ignore emitters not registered in TD", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["COLLECTOR"]
      }
    });
    await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: siretify(1),
        recipientCompanySiret: company.orgId
      }
    });
    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await query<Pick<Query, "favorites">>(FAVORITES, {
      variables: {
        orgId: company.orgId,
        type: "EMITTER"
      }
    });

    expect(data.favorites).toEqual([]);
  });

  it("should return recent recipients", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });
    const recipient = await companyFactory();
    await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.orgId,
        recipientCompanySiret: recipient.orgId
      }
    });

    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await query<Pick<Query, "favorites">>(FAVORITES, {
      variables: {
        orgId: company.orgId,
        type: "RECIPIENT"
      }
    });

    expect(data.favorites).toEqual([
      expect.objectContaining({
        orgId: recipient.orgId,
        name: recipient.name,
        address: recipient.address,
        vatNumber: null,
        mail: recipient.contactEmail,
        phone: recipient.contactPhone,
        codePaysEtrangerEtablissement: "FR",
        contact: recipient.contact
      })
    ]);
  });

  it("should ignore recipients not registered in TD", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });
    await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.orgId,
        recipientCompanySiret: siretify(1)
      }
    });
    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await query<Pick<Query, "favorites">>(FAVORITES, {
      variables: {
        orgId: company.orgId,
        type: "RECIPIENT"
      }
    });

    expect(data.favorites).toEqual([]);
  });

  it("should return recent french transporters", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });
    const transporter = await companyFactory({
      transporterReceipt: {
        create: {
          receiptNumber: "receipt",
          validityLimit: new Date(),
          department: "07"
        }
      }
    });
    await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.orgId,
        transporters: {
          create: { transporterCompanySiret: transporter.orgId, number: 1 }
        },
        transportersSirets: [transporter.orgId!]
      }
    });

    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await query<Pick<Query, "favorites">>(FAVORITES, {
      variables: {
        orgId: company.orgId,
        type: "TRANSPORTER"
      }
    });

    expect(data.favorites).toEqual([
      expect.objectContaining({
        orgId: transporter.orgId,
        name: transporter.name,
        address: transporter.address,
        vatNumber: null,
        mail: transporter.contactEmail,
        phone: transporter.contactPhone,
        codePaysEtrangerEtablissement: "FR",
        contact: transporter.contact,
        transporterReceipt: expect.objectContaining({
          receiptNumber: "receipt"
        })
      })
    ]);
  });

  it("should return recent UE transporters", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });
    const transporter = await companyFactory({
      vatNumber: "IT09301420155",
      orgId: "IT09301420155"
    });
    await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.orgId,
        transporters: {
          create: {
            transporterCompanyVatNumber: transporter.vatNumber,
            number: 1
          }
        }
      }
    });

    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await query<Pick<Query, "favorites">>(FAVORITES, {
      variables: {
        orgId: company.orgId,
        type: "TRANSPORTER"
      }
    });

    expect(data.favorites).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          orgId: transporter.orgId,
          name: transporter.name,
          address: transporter.address,
          vatNumber: transporter.vatNumber,
          mail: transporter.contactEmail,
          phone: transporter.contactPhone,
          codePaysEtrangerEtablissement: "IT",
          contact: transporter.contact
        })
      ])
    );
  });

  it("should ignore transporters not registered in TD", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });
    await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.orgId,
        transporters: {
          create: {
            transporterCompanySiret: siretify(1),
            number: 1
          }
        }
      }
    });
    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await query<Pick<Query, "favorites">>(FAVORITES, {
      variables: {
        orgId: company.orgId,
        type: "TRANSPORTER"
      }
    });

    expect(data.favorites).toEqual([]);
  });

  it("should return recent temporary storage", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });
    const tempStorer = await companyFactory();
    await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.orgId,
        recipientCompanySiret: tempStorer.orgId,
        recipientIsTempStorage: true
      }
    });

    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await query<Pick<Query, "favorites">>(FAVORITES, {
      variables: {
        orgId: company.orgId,
        type: "TEMPORARY_STORAGE_DETAIL"
      }
    });

    expect(data.favorites).toEqual([
      expect.objectContaining({
        orgId: tempStorer.orgId,
        name: tempStorer.name,
        address: tempStorer.address,
        vatNumber: null,
        mail: tempStorer.contactEmail,
        phone: tempStorer.contactPhone,
        contact: tempStorer.contact,
        codePaysEtrangerEtablissement: "FR"
      })
    ]);
  });

  it("should ignore temporary storage not registered in TD", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });
    await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.orgId,
        recipientCompanySiret: siretify(1),
        recipientIsTempStorage: true
      }
    });
    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await query<Pick<Query, "favorites">>(FAVORITES, {
      variables: {
        orgId: company.orgId,
        type: "TEMPORARY_STORAGE_DETAIL"
      }
    });

    expect(data.favorites).toEqual([]);
  });

  it("should return recent destination after temporary storage", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });
    const destination = await companyFactory();

    await formWithTempStorageFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.orgId,
        recipientsSirets: [destination.orgId!]
      },
      forwardedInOpts: { recipientCompanySiret: destination.orgId }
    });

    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await query<Pick<Query, "favorites">>(FAVORITES, {
      variables: {
        orgId: company.orgId,
        type: "DESTINATION"
      }
    });

    expect(data.favorites).toEqual([
      expect.objectContaining({
        orgId: destination.orgId,
        name: destination.name,
        address: destination.address,
        vatNumber: null,
        mail: destination.contactEmail,
        phone: destination.contactPhone,
        contact: destination.contact,
        codePaysEtrangerEtablissement: "FR"
      })
    ]);
  });

  it("should ignore destinations after temp storage not registered in TD", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });

    await formWithTempStorageFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: company.orgId },
      forwardedInOpts: { recipientCompanySiret: siretify(1) }
    });

    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await query<Pick<Query, "favorites">>(FAVORITES, {
      variables: {
        orgId: company.orgId,
        type: "DESTINATION"
      }
    });

    expect(data.favorites).toEqual([]);
  });

  it("should return recent next destinations", async () => {
    const orgId = siretify(1);
    const destination: CompanySearchResult = {
      orgId,
      siret: orgId,
      address: "rue des 4 chemins",
      name: "Destination ultérieure",
      isRegistered: true,
      companyTypes: ["WASTEPROCESSOR"],
      statutDiffusionEtablissement: "O",
      contactEmail: "contact@traiteur.co",
      contactPhone: "00 00 00 00 00",
      contact: "John Snow"
    };
    searchCompanySpy.mockResolvedValueOnce(destination);

    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });

    await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.orgId,
        nextDestinationCompanySiret: destination.orgId
      }
    });

    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await query<Pick<Query, "favorites">>(FAVORITES, {
      variables: {
        orgId: company.orgId,
        type: "NEXT_DESTINATION"
      }
    });

    expect(data.favorites).toEqual([
      expect.objectContaining({
        orgId: destination.orgId,
        name: destination.name,
        address: destination.address,
        vatNumber: null,
        mail: destination.contactEmail,
        phone: destination.contactPhone,
        contact: destination.contact,
        codePaysEtrangerEtablissement: "FR"
      })
    ]);
  });

  it("should not return next destinations not present in SIRENE database", async () => {
    searchCompanySpy.mockRejectedValueOnce("Entreprise inconnue");
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });

    await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.orgId,
        nextDestinationCompanySiret: siretify(1)
      }
    });

    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await query<Pick<Query, "favorites">>(FAVORITES, {
      variables: {
        orgId: company.orgId,
        type: "NEXT_DESTINATION"
      }
    });

    expect(data.favorites).toEqual([]);
  });

  it("should return recent traders", async () => {
    const trader = await companyFactory({
      companyTypes: ["TRADER"],
      traderReceipt: {
        create: {
          receiptNumber: "receipt",
          department: "07",
          validityLimit: new Date()
        }
      }
    });

    const traderSirene: CompanySearchResult = {
      orgId: trader.orgId!,
      siret: trader.orgId,
      address: "rue des 4 chemins",
      name: "Négociant",
      isRegistered: true,
      companyTypes: ["TRADER"],
      statutDiffusionEtablissement: "O",
      contactEmail: "contact@trader.co",
      contactPhone: "00 00 00 00 00",
      contact: "John Snow"
    };
    searchCompanySpy.mockResolvedValueOnce(traderSirene);

    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });

    await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.orgId,
        traderCompanySiret: trader.orgId
      }
    });

    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await query<Pick<Query, "favorites">>(FAVORITES, {
      variables: {
        orgId: company.orgId,
        type: "TRADER"
      }
    });

    expect(data.favorites).toEqual([
      expect.objectContaining({
        orgId: traderSirene.orgId,
        name: traderSirene.name,
        address: traderSirene.address,
        vatNumber: null,
        mail: traderSirene.contactEmail,
        phone: traderSirene.contactPhone,
        contact: traderSirene.contact,
        codePaysEtrangerEtablissement: "FR",
        traderReceipt: {
          receiptNumber: "receipt"
        }
      })
    ]);
  });

  it("should return recent brokers", async () => {
    const broker = await companyFactory({
      companyTypes: ["BROKER"],
      brokerReceipt: {
        create: {
          receiptNumber: "receipt",
          department: "07",
          validityLimit: new Date()
        }
      }
    });

    const brokerSirene: CompanySearchResult = {
      orgId: broker.orgId,
      siret: broker.orgId!,
      address: "rue des 4 chemins",
      name: "Courtier",
      isRegistered: true,
      companyTypes: ["BROKER"],
      statutDiffusionEtablissement: "O",
      contactEmail: "contact@broker.co",
      contactPhone: "00 00 00 00 00",
      contact: "John Snow"
    };
    searchCompanySpy.mockResolvedValueOnce(brokerSirene);

    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });

    await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.orgId,
        brokerCompanySiret: broker.orgId
      }
    });

    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await query<Pick<Query, "favorites">>(FAVORITES, {
      variables: {
        orgId: company.orgId,
        type: "BROKER"
      }
    });

    expect(data.favorites).toEqual([
      expect.objectContaining({
        orgId: brokerSirene.orgId,
        name: brokerSirene.name,
        address: brokerSirene.address,
        vatNumber: null,
        mail: brokerSirene.contactEmail,
        phone: brokerSirene.contactPhone,
        contact: brokerSirene.contact,
        codePaysEtrangerEtablissement: "FR",
        brokerReceipt: {
          receiptNumber: "receipt"
        }
      })
    ]);
  });

  it("should return the user's company if it matches the favorite type", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });

    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { data, errors } = await query<Pick<Query, "favorites">>(FAVORITES, {
      variables: {
        orgId: company.orgId,
        type: "EMITTER"
      }
    });

    expect(errors).toBeUndefined();
    expect(data.favorites).toEqual([
      expect.objectContaining({
        orgId: company.orgId,
        codePaysEtrangerEtablissement: "FR"
      })
    ]);
  });

  it("should return the user's company even if there are other results", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });

    const emitter1 = await companyFactory();
    const emitter2 = await companyFactory();
    const firstForm = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: emitter1.orgId,
        recipientsSirets: [company.orgId!]
      }
    });
    const secondForm = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: emitter2.orgId,
        recipientsSirets: [company.orgId!]
      }
    });

    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await query<Pick<Query, "favorites">>(FAVORITES, {
      variables: {
        orgId: company.orgId,
        type: "EMITTER"
      }
    });

    expect(data.favorites).toEqual([
      expect.objectContaining({
        orgId: firstForm.emitterCompanySiret,
        codePaysEtrangerEtablissement: "FR"
      }),
      expect.objectContaining({
        orgId: secondForm.emitterCompanySiret,
        codePaysEtrangerEtablissement: "FR"
      }),
      expect.objectContaining({
        orgId: company.orgId,
        codePaysEtrangerEtablissement: "FR"
      })
    ]);
  });

  it("should return the user's company based on an existing BSD", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });
    const emitter1 = await companyFactory();
    const emitter2 = await companyFactory();

    const firstForm = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: emitter1.orgId,
        recipientsSirets: [company.orgId!]
      }
    });
    const secondForm = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: emitter2.orgId,
        recipientsSirets: [company.orgId!]
      }
    });
    await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.orgId
      }
    });

    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await query<Pick<Query, "favorites">>(FAVORITES, {
      variables: {
        orgId: company.orgId,
        type: "EMITTER"
      }
    });

    expect(data.favorites).toEqual([
      expect.objectContaining({
        orgId: company.orgId,
        codePaysEtrangerEtablissement: "FR"
      }),
      expect.objectContaining({
        orgId: firstForm.emitterCompanySiret,
        codePaysEtrangerEtablissement: "FR"
      }),
      expect.objectContaining({
        orgId: secondForm.emitterCompanySiret,
        codePaysEtrangerEtablissement: "FR"
      })
    ]);
  });

  it("should not return the same company twice", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["COLLECTOR"]
      }
    });
    const emitter = await companyFactory();
    const firstForm = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanyName: "A Name",
        emitterCompanySiret: emitter.orgId,
        recipientsSirets: [company.orgId!]
      }
    });
    await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanyName: "Another Name",
        emitterCompanySiret: firstForm.emitterCompanySiret,
        recipientsSirets: [company.orgId!]
      }
    });

    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await query<Pick<Query, "favorites">>(FAVORITES, {
      variables: {
        orgId: company.orgId,
        type: "EMITTER"
      }
    });

    expect(data.favorites).toEqual([
      expect.objectContaining({
        orgId: firstForm.emitterCompanySiret,
        codePaysEtrangerEtablissement: "FR"
      })
    ]);

    // Test with VAT numbers

    const transporter = await companyFactory({
      vatNumber: "IT09301420155"
    });

    await formFactory({
      ownerId: user.id,
      opt: {
        transporters: {
          create: {
            transporterCompanyName: "A Name",
            transporterCompanyVatNumber: transporter.vatNumber,
            number: 1
          }
        },
        recipientsSirets: [company.orgId!]
      }
    });
    await formFactory({
      ownerId: user.id,
      opt: {
        transporters: {
          create: {
            transporterCompanyName: "Another Name",
            transporterCompanyVatNumber: transporter.vatNumber,
            number: 1
          }
        },
        recipientsSirets: [company.orgId!]
      }
    });

    const { data: data2 } = await query<Pick<Query, "favorites">>(FAVORITES, {
      variables: {
        orgId: company.orgId,
        type: "TRANSPORTER"
      }
    });

    expect(data2.favorites).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          vatNumber: "IT09301420155",
          codePaysEtrangerEtablissement: "IT"
        })
      ])
    );
  });

  it("should suggest a temporary storage detail destination", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: ["PRODUCER"]
      }
    });
    const destination = await companyFactory();
    const recipientCompanySiret = siretify(1);
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.orgId,
        recipientCompanySiret,
        recipientIsTempStorage: true,
        forwardedIn: {
          create: {
            readableId: getReadableId(),
            ownerId: user.id,
            recipientCompanySiret: destination.orgId
          }
        },
        recipientsSirets: [recipientCompanySiret, destination.orgId!]
      }
    });
    const forwardedIn = await prisma.form
      .findUniqueOrThrow({ where: { id: form.id } })
      .forwardedIn();

    const { query } = makeClient({ ...user, auth: AuthType.Session });
    const { data } = await query<Pick<Query, "favorites">>(FAVORITES, {
      variables: {
        orgId: company.orgId,
        type: "DESTINATION"
      }
    });

    expect(data.favorites).toEqual([
      expect.objectContaining({
        orgId: forwardedIn?.recipientCompanySiret
      })
    ]);
  });
});

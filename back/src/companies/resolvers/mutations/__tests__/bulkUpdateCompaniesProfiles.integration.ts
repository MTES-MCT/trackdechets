import { UserRole } from "@prisma/client";
import { gql } from "graphql-tag";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "@td/prisma";
import {
  siretify,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

export const BULK_UPDATE_COMPANIES_PROFILES = gql`
  mutation bulkUpdateCompaniesProfiles(
    $input: BulkUpdateCompaniesProfilesInput!
  ) {
    bulkUpdateCompaniesProfiles(input: $input) {
      siret
      companyTypes
      collectorTypes
      wasteProcessorTypes
      wasteVehiclesTypes
    }
  }
`;

describe("mutation bulkUpdateCompaniesProfiles", () => {
  afterAll(resetDatabase);

  it("should deny access to non admin users", async () => {
    const nonAdmin = await userFactory({ isAdmin: false });

    const { user, company } = await userWithCompanyFactory(UserRole.ADMIN, {
      companyTypes: {
        set: ["WASTEPROCESSOR"]
      }
    });

    const { mutate } = makeClient(nonAdmin);

    const { errors } = await mutate(BULK_UPDATE_COMPANIES_PROFILES, {
      variables: {
        input: {
          adminEmail: user.email,
          companyUpdateRows: [
            {
              orgId: company.siret,
              companyTypes: ["WASTEPROCESSOR", "COLLECTOR"],
              collectorTypes: ["DANGEROUS_WASTES"],
              wasteProcessorTypes: [],
              wasteVehiclesTypes: []
            }
          ]
        }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({ message: "Vous n'êtes pas administrateur" })
    ]);
  });

  it("should raise an error if companies does not exist in db", async () => {
    const admin = await userFactory({ isAdmin: true });

    const { user, company } = await userWithCompanyFactory(
      UserRole.ADMIN,
      {
        companyTypes: {
          set: ["WASTEPROCESSOR"]
        }
      },
      { isAdmin: true }
    );

    const { mutate } = makeClient(admin);

    const fakeSiret = siretify(1);

    const { errors } = await mutate(BULK_UPDATE_COMPANIES_PROFILES, {
      variables: {
        input: {
          adminEmail: user.email,
          companyUpdateRows: [
            {
              orgId: company.siret,
              companyTypes: ["WASTEPROCESSOR", "COLLECTOR"],
              collectorTypes: ["DANGEROUS_WASTES"],
              wasteProcessorTypes: [],
              wasteVehiclesTypes: []
            },
            {
              orgId: fakeSiret, // fake company
              companyTypes: ["WASTEPROCESSOR", "COLLECTOR"],
              collectorTypes: ["DANGEROUS_WASTES"],
              wasteProcessorTypes: [],
              wasteVehiclesTypes: []
            }
          ]
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `Certains établissements n'existent pas dans Trackdéchets ou l'email renseigné n'est pas celui de leur administrateur: ${fakeSiret}`
      })
    ]);
  });

  it("should not update companies which do not belong to the adminEmail", async () => {
    const admin = await userFactory({ isAdmin: true });

    const { user, company } = await userWithCompanyFactory(
      UserRole.ADMIN,
      {
        companyTypes: {
          set: ["WASTEPROCESSOR"]
        }
      },
      { isAdmin: true }
    );

    const { company: otherCompany } = await userWithCompanyFactory(
      UserRole.ADMIN,
      {
        companyTypes: {
          set: ["WASTEPROCESSOR"]
        }
      },
      { isAdmin: true }
    );
    const { mutate } = makeClient(admin);

    const { errors } = await mutate(BULK_UPDATE_COMPANIES_PROFILES, {
      variables: {
        input: {
          adminEmail: user.email,
          companyUpdateRows: [
            {
              orgId: company.siret,
              companyTypes: ["WASTEPROCESSOR", "COLLECTOR"],
              collectorTypes: ["DANGEROUS_WASTES"],
              wasteProcessorTypes: [],
              wasteVehiclesTypes: []
            },
            {
              orgId: otherCompany.siret,
              companyTypes: ["WASTEPROCESSOR", "COLLECTOR"],
              collectorTypes: ["DANGEROUS_WASTES"],
              wasteProcessorTypes: [],
              wasteVehiclesTypes: []
            }
          ]
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `Certains établissements n'existent pas dans Trackdéchets ou l'email renseigné n'est pas celui de leur administrateur: ${otherCompany.siret}`
      })
    ]);
  });

  it("should raise an error if there are duplicatess", async () => {
    const admin = await userFactory({ isAdmin: true });

    const { user, company } = await userWithCompanyFactory(
      UserRole.ADMIN,
      {
        companyTypes: {
          set: ["WASTEPROCESSOR"]
        }
      },
      { isAdmin: true }
    );

    const { mutate } = makeClient(admin);

    const { errors } = await mutate(BULK_UPDATE_COMPANIES_PROFILES, {
      variables: {
        input: {
          adminEmail: user.email,
          companyUpdateRows: [
            {
              orgId: company.siret,
              companyTypes: ["WASTEPROCESSOR", "COLLECTOR"],
              collectorTypes: ["DANGEROUS_WASTES"],
              wasteProcessorTypes: [],
              wasteVehiclesTypes: []
            },
            {
              orgId: company.siret,
              companyTypes: ["WASTEPROCESSOR", "COLLECTOR"],
              collectorTypes: ["DANGEROUS_WASTES"],
              wasteProcessorTypes: [],
              wasteVehiclesTypes: []
            }
          ]
        }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: `La liste des établissements à mettre à jour comporte des doublons.`
      })
    ]);
  });

  it("should raise an error if profiles and subprofiles do not validate (collectorTypes)", async () => {
    const admin = await userFactory({ isAdmin: true });

    const { user, company } = await userWithCompanyFactory(
      UserRole.ADMIN,
      {
        companyTypes: {
          set: ["WASTEPROCESSOR"]
        }
      },
      { isAdmin: true }
    );

    const { mutate } = makeClient(admin);

    const { errors } = await mutate(BULK_UPDATE_COMPANIES_PROFILES, {
      variables: {
        input: {
          adminEmail: user.email,
          companyUpdateRows: [
            {
              orgId: company.siret,
              companyTypes: ["WASTEPROCESSOR"],
              collectorTypes: ["DANGEROUS_WASTES"],
              wasteProcessorTypes: [],
              wasteVehiclesTypes: []
            }
          ]
        }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: `Impossible de sélectionner un sous-type d'installation de tri, transit, regroupement si le profil Installation de Tri, transit regroupement de déchets n'est pas sélectionné`
      })
    ]);
  });

  it("should raise an error if profiles and subprofiles do not validate (wasteProcessorTypes)", async () => {
    const admin = await userFactory({ isAdmin: true });

    const { user, company } = await userWithCompanyFactory(
      UserRole.ADMIN,
      {
        companyTypes: {
          set: ["WASTEPROCESSOR"]
        }
      },
      { isAdmin: true }
    );

    const { mutate } = makeClient(admin);

    const { errors } = await mutate(BULK_UPDATE_COMPANIES_PROFILES, {
      variables: {
        input: {
          adminEmail: user.email,
          companyUpdateRows: [
            {
              orgId: company.siret,
              companyTypes: ["COLLECTOR"],
              collectorTypes: ["DANGEROUS_WASTES"],
              wasteProcessorTypes: ["DANGEROUS_WASTES_STORAGE"],
              wasteVehiclesTypes: []
            }
          ]
        }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: `Impossible de sélectionner un sous-type d'installation de traitement si le profil Installation de traitement n'est pas sélectionné`
      })
    ]);
  });

  it("should raise an error if profiles and subprofiles do not validate (wasteVehiclesTypes)", async () => {
    const admin = await userFactory({ isAdmin: true });

    const { user, company } = await userWithCompanyFactory(
      UserRole.ADMIN,
      {
        companyTypes: {
          set: ["WASTEPROCESSOR"]
        }
      },
      { isAdmin: true }
    );

    const { mutate } = makeClient(admin);

    const { errors } = await mutate(BULK_UPDATE_COMPANIES_PROFILES, {
      variables: {
        input: {
          adminEmail: user.email,
          companyUpdateRows: [
            {
              orgId: company.siret,
              companyTypes: ["COLLECTOR"],
              collectorTypes: ["DANGEROUS_WASTES"],
              wasteProcessorTypes: [],
              wasteVehiclesTypes: ["DEMOLISSEUR"]
            }
          ]
        }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: `Impossible de sélectionner un sous-type d'installation de traitement VHU si le profil Installation de traitement VHU n'est pas sélectionné`
      })
    ]);
  });

  it("should update companies", async () => {
    const admin = await userFactory({ isAdmin: true });

    const { user, company } = await userWithCompanyFactory(
      UserRole.ADMIN,
      {
        companyTypes: {
          set: ["WASTEPROCESSOR"]
        }
      },
      { isAdmin: true }
    );

    const { mutate } = makeClient(admin);

    const { errors } = await mutate(BULK_UPDATE_COMPANIES_PROFILES, {
      variables: {
        input: {
          adminEmail: user.email,
          companyUpdateRows: [
            {
              orgId: company.siret,
              companyTypes: ["WASTEPROCESSOR", "COLLECTOR"],
              collectorTypes: ["DANGEROUS_WASTES"],
              wasteProcessorTypes: [],
              wasteVehiclesTypes: []
            }
          ]
        }
      }
    });
    expect(errors).toBeUndefined();
    const updatedCompany = await prisma.company.findUnique({
      where: { id: company.id }
    });
    expect(updatedCompany?.companyTypes).toEqual([
      "WASTEPROCESSOR",
      "COLLECTOR"
    ]);
  });
});

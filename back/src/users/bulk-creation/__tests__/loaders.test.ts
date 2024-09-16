import { loadCompanies, loadRoles } from "../loaders";

describe("loaders", () => {
  it("should load companies from csv", async () => {
    const companies = await loadCompanies(`${__dirname}/csv`);
    expect(companies).toHaveLength(2);
    expect(companies).toEqual([
      {
        siret: "85001946400013",
        gerepId: "1234",
        companyTypes: ["PRODUCER"],
        collectorTypes: [],
        wasteProcessorTypes: [],
        wasteVehiclesTypes: [],
        givenName: "Code en Stock",
        contactEmail: "codeenstock@trackdechets.fr",
        contactPhone: "0600000000",
        contact: "Marcel Machin",
        website: "https://codeenstock.trackdechets.fr"
      },
      {
        siret: "81343950200028",
        gerepId: "2345",
        companyTypes: ["PRODUCER", "WASTEPROCESSOR"],
        collectorTypes: [],
        wasteProcessorTypes: ["OTHER_DANGEROUS_WASTES"],
        wasteVehiclesTypes: [],
        givenName: "Frontier SAS",
        contactEmail: "frontier@trackdechets.fr",
        contactPhone: "0700000000",
        contact: "",
        website: "https://frontier.trackdechets.fr"
      }
    ]);
  });

  it("should load roles from csv", async () => {
    const roles = await loadRoles(`${__dirname}/csv`);
    expect(roles).toHaveLength(4);
    expect(roles).toEqual([
      {
        siret: "85001946400013",
        email: "john.snow@trackdechets.fr",
        role: "ADMIN"
      },
      {
        siret: "81343950200028",
        email: "arya.stark@trackdechets.fr",
        role: "ADMIN"
      },
      {
        siret: "85001946400013",
        email: "tyrion.lannister@trackdechets.fr",
        role: "MEMBER"
      },
      {
        siret: "81343950200028",
        email: "tyrion.lannister@trackdechets.fr",
        role: "MEMBER"
      }
    ]);
  });
});

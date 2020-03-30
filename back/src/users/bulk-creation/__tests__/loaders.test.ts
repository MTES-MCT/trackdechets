describe("loaders", () => {
  const OLD_ENV = process.env;
  process.env.CSV_DIR = `${__dirname}/csv`;

  beforeAll(() => {
    jest.resetModules();
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it("should load companies from csv", async () => {
    const { loadCompanies } = require("../loaders");

    const companies = await loadCompanies();
    expect(companies).toHaveLength(2);
    expect(companies).toEqual([
      {
        siret: "85001946400013",
        gerepId: "1234",
        companyTypes: ["PRODUCER"],
        givenName: "Code en Stock",
        contactEmail: "codeenstock@trackdechets.fr",
        contactPhone: "0600000000",
        website: "https://codeenstock.trackdechets.fr"
      },
      {
        siret: "81343950200028",
        gerepId: "2345",
        companyTypes: ["PRODUCER", "WASTE_PROCESSOR"],
        givenName: "Frontier SAS",
        contactEmail: "frontier@trackdechets.fr",
        contactPhone: "0700000000",
        website: "https://frontier.trackdechets.fr"
      }
    ]);
  });

  it("should load roles from csv", async () => {
    const { loadRoles } = require("../loaders");
    const roles = await loadRoles();
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

import express, { json, Express } from "express";
import supertest, { SuperTest, Test } from "supertest";
import sanitizePathBodyMiddleware from "../sanitizePathBody";

// GraphQL endpoint
const graphQLPath = "/";

describe("sanitizePathBodyMiddleware", () => {
  let request: SuperTest<Test>;
  let app: Express;

  function setupTestApp() {
    app = express();
    app.use(json());
    app.use(sanitizePathBodyMiddleware(graphQLPath));
  }

  beforeEach(() => {
    jest.resetModules();
  });

  it("should not modify valid graphql response", async () => {
    setupTestApp();
    /**
     * Good JSON
     */
    app.get(graphQLPath, (req, res) =>
      res.json({
        is: true,
        good: "oué",
        nested: {
          is: 4
        }
      })
    );

    request = supertest(app);
    const { body } = await request.get(graphQLPath);
    expect(body.is).toEqual(true);
    expect(body.good).toEqual("oué");
    expect(body.nested.is).toEqual(4);
  });

  it("should not apply to endpoint other than graphql", async () => {
    setupTestApp();
    /**
     * Excluded endpoint path
     */
    app.get("/else", (req, res) =>
      res.json({
        is: true,
        good: "<script>oué"
      })
    );

    request = supertest(app);
    const { body } = await request.get("/else");
    expect(body.is).toEqual(true);
    expect(body.good).toEqual("<script>oué");
  });

  it("should remove <script> tag in json response", async () => {
    setupTestApp();
    /**
     * Wrong JSON
     */
    app.get(graphQLPath, (req, res) =>
      res.json({
        is: true,
        type: "json",
        bad: "<script>oué</script>"
      })
    );

    request = supertest(app);
    const { body } = await request.get(graphQLPath);
    expect(body.is).toEqual(true);
    expect(body.bad).toEqual("oué");
  });

  it("should remove <script> tag in string with res.send", async () => {
    setupTestApp();
    app.get(graphQLPath, (req, res) => res.send("<script>oué</script>"));
    request = supertest(app);
    const { text } = await request.get(graphQLPath);
    expect(text).toEqual("oué");
  });

  it("should not apply to res.end response", async () => {
    setupTestApp();
    app.get(graphQLPath, (req, res) => res.end("<script>oué</script>"));
    request = supertest(app);
    const { text } = await request.get(graphQLPath);
    expect(text).toEqual("<script>oué</script>");
  });

  it("should remove <script> tag in Buffer response", async () => {
    setupTestApp();
    app.get(graphQLPath, (req, res) =>
      res.send(Buffer.from("<script>oué</script>"))
    );
    request = supertest(app);
    const { body } = await request.get(graphQLPath);
    expect(body).toEqual(Buffer.from("oué"));
  });

  it("should remove <script> tag in array response", async () => {
    setupTestApp();
    app.get(graphQLPath, (req, res) => res.send(["<script>oué</script>"]));
    request = supertest(app);
    const { body } = await request.get(graphQLPath);
    expect(body[0]).toEqual("oué");
  });

  it("should remove <script> tag in object response", async () => {
    setupTestApp();
    app.get(graphQLPath, (req, res) =>
      res.send({ bad: "<script>oué</script>", type: "object" })
    );
    request = supertest(app);
    const { body } = await request.get(graphQLPath);
    expect(body.bad).toEqual("oué");
  });

  it("should remove forbidden opening tag only", async () => {
    setupTestApp();
    /**
     * Wrong JSON
     */
    app.get(graphQLPath, (req, res) =>
      res.json({
        is: true,
        type: "json",
        bad: "<script>yes"
      })
    );

    request = supertest(app);
    const { body } = await request.get(graphQLPath);
    expect(body.is).toEqual(true);
    expect(body.bad).toEqual("yes");
  });

  it("should handle nested tags", async () => {
    setupTestApp();
    /**
     * Wrong JSON
     */
    app.get(graphQLPath, (req, res) =>
      res.json({
        is: true,
        type: "nestedtags",
        bad: "<sc<script></script>ript>alert(1)</script>"
      })
    );

    request = supertest(app);
    const { body } = await request.get(graphQLPath);
    expect(body.is).toEqual(true);
    expect(body.bad).toEqual("&lt;script&gt;alert(1)");
  });

  it("should handle nested variables", async () => {
    setupTestApp();
    /**
     * Wrong JSON
     */
    app.get(graphQLPath, (req, res) =>
      res.json({
        is: true,
        type: "nested",
        bad: {
          nested: "<script></script>bar"
        }
      })
    );

    request = supertest(app);
    const { body } = await request.get(graphQLPath);
    expect(body.is).toEqual(true);
    expect(body.bad.nested).toEqual("bar");
  });

  it("should not mess up with json data", async () => {
    setupTestApp();
    const data = {
      __typename: "Form",
      id: "cl0cb9kwe0180tayuyu2ogctz",
      customId: "",
      sentAt: null,
      emitter: {
        type: "PRODUCER",
        workSite: null,
        company: {
          name: "CENTRE AUTO BOLLIER",
          siret: "79763653700012",
          address: "106 RUE ANDRE BOLLIER 69007 LYON 7EME",
          contact: "PRODUCTEUR Benoit",
          country: "FR",
          phone: "06 06 06 06 06",
          mail: "hello+producteur@benoitguigal.fr",
          __typename: "FormCompany"
        },
        __typename: "Emitter"
      },
      recipient: {
        cap: "cap",
        processingOperation: "R 1",
        isTempStorage: false,
        company: {
          name: "TREDI",
          siret: "33818576200162",
          address: "ALL DES PINS ZI DE LA PLAINE DE L'AIN 01150 SAINT-VULBAS",
          contact: "Benoit Guigal",
          country: "FR",
          phone: "0667789588",
          mail: "benoit.guigal@protonmail.com",
          __typename: "FormCompany"
        },
        __typename: "Recipient"
      },
      transporter: {
        isExemptedOfReceipt: false,
        receipt: "0101010101",
        department: "69",
        validityLimit: "2023-12-31T23:00:00.000Z",
        numberPlate: "",
        customInfo: null,
        mode: "ROAD",
        company: {
          name: "SAS HEXATRANS",
          siret: "33902484600034",
          address: "BD DES NATIONS 69780 MIONS",
          contact: "Benoit Guigal",
          country: "FR",
          phone: "0667789588",
          mail: "benoit.guigal@protonmail.com",
          __typename: "FormCompany"
        },
        __typename: "Transporter"
      },
      trader: null,
      broker: null,
      wasteDetails: {
        code: "03 01 01",
        name: "écorces",
        onuCode: "adr",
        packagingInfos: [
          {
            type: "AUTRE",
            other: "Bonbonne (>5L - <100L)",
            quantity: 1,
            __typename: "PackagingInfo"
          }
        ],
        quantity: 1,
        quantityType: "ESTIMATED",
        consistence: "SOLID",
        pop: false,
        __typename: "WasteDetails"
      },
      appendix2Forms: [],
      ecoOrganisme: null,
      temporaryStorageDetail: null,
      currentTransporterSiret: null,
      nextTransporterSiret: null,
      transportSegments: [],
      readableId: "BSD-20220304-9FZTZXEGX",
      createdAt: "2022-03-04T11:06:02.894Z",
      status: "DRAFT",
      stateSummary: {
        packagingInfos: [
          {
            type: "AUTRE",
            other: "Bonbonne (>5L - <100L)",
            quantity: 1,
            __typename: "PackagingInfo"
          }
        ],
        onuCode: "adr",
        quantity: 1,
        transporterNumberPlate: "",
        transporterCustomInfo: null,
        transporter: {
          name: "SAS HEXATRANS",
          siret: "33902484600034",
          address: "BD DES NATIONS 69780 MIONS",
          contact: "Benoit Guigal",
          country: "FR",
          phone: "0667789588",
          mail: "benoit.guigal@protonmail.com",
          __typename: "FormCompany"
        },
        recipient: {
          name: "TREDI",
          siret: "33818576200162",
          address: "ALL DES PINS ZI DE LA PLAINE DE L'AIN 01150 SAINT-VULBAS",
          contact: "Benoit Guigal",
          country: "FR",
          phone: "0667789588",
          mail: "benoit.guigal@protonmail.com",
          __typename: "FormCompany"
        },
        emitter: {
          name: "CENTRE AUTO BOLLIER",
          siret: "79763653700012",
          address: "106 RUE ANDRE BOLLIER 69007 LYON 7EME",
          contact: "PRODUCTEUR Benoit",
          country: "FR",
          phone: "06 06 06 06 06",
          mail: "hello+producteur@benoitguigal.fr",
          __typename: "FormCompany"
        },
        lastActionOn: "2022-03-04T11:06:02.894Z",
        __typename: "StateSummary"
      }
    };
    app.get(graphQLPath, (req, res) => res.json(data));
    request = supertest(app);
    const { body } = await request.get(graphQLPath);
    // received "StateSummary"
    expect(body.wasteDetails.__typename).toEqual("WasteDetails");
  });
});

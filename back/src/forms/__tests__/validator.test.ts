import { formSchema } from "../validator";

const form = {
  id: "cjplbvecc000d0766j32r19am",
  emitter: {
    type: "PRODUCER",
    pickupSite: "Nom:\nAdresse:\nMail:",
    company: {
      name: "A company 2",
      siret: "XXX XXX XXX 0002",
      address: "8 rue du Général de Gaulle",
      contact: "Emetteur",
      phone: "01",
      mail: "e@e.fr"
    }
  },
  recipient: {
    cap: "1234",
    processingOperation: "D 6",
    company: {
      name: "A company 3",
      siret: "XXX XXX XXX 0003",
      address: "8 rue du Général de Gaulle",
      contact: "Destination",
      phone: "02",
      mail: "d@d.fr"
    }
  },
  transporter: {
    receipt: "sdfg",
    department: "82",
    validityLimit: "2018-12-11T00:00:00.000Z",
    numberPlate: "12345",
    company: {
      name: "A company 4",
      siret: "XXX XXX XXX 0004",
      address: "8 rue du Général de Gaulle",
      contact: "Transporteur",
      phone: "03",
      mail: "t@t.fr"
    }
  },
  wasteDetails: {
    code: "01 03 04*",
    onuCode: "AAA",
    packagings: ["CITERNE", "GRV"],
    otherPackaging: "",
    numberOfPackages: 2,
    quantity: 1.5,
    quantityType: "REAL"
  }
};

describe("Form is valid", () => {
  test("when fully filled", async () => {
    const isValid = await formSchema.isValid({ ...form });
    expect(isValid).toEqual(true);
  });

  test("with empty strings for optionnal fields", async () => {
    const testForm = {
      ...form,
      emitter: { ...form.emitter, pickupSite: "" },
      recipient: { ...form.recipient, cap: "" },
      transporter: { ...form.transporter, numberPlate: "" }
    };
    const isValid = await formSchema.isValid(testForm);
    expect(isValid).toEqual(true);
  });

  test("with null values for optionnal fields", async () => {
    const testForm = {
      ...form,
      emitter: { ...form.emitter, pickupSite: null },
      recipient: { ...form.recipient, cap: null },
      transporter: {
        ...form.transporter,
        validityLimit: null,
        numberPlate: null
      }
    };
    const isValid = await formSchema.isValid(testForm);
    expect(isValid).toEqual(true);
  });

  test("with R.541-50 ticked and no transportation infos", async () => {
    const testForm = {
      ...form,
      transporter: {
        ...form.transporter,
        isExemptedOfReceipt: true,
        receipt: null,
        department: null
      }
    };

    const isValid = await formSchema.isValid(testForm);
    expect(isValid).toEqual(true);
  });
});

describe("Form is not valid", () => {
  test("when there is no receipt exemption and no receipt", async () => {
    const testForm = {
      ...form,
      transporter: {
        ...form.transporter,
        isExemptedOfReceipt: false,
        receipt: null
      }
    };

    const isValid = await formSchema.isValid(testForm);
    expect(isValid).toEqual(false);
  });
});

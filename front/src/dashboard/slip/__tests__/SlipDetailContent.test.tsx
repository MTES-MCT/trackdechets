import React from "react";
import SlipDetailContent from "../SlipDetailContent";
import "@testing-library/jest-dom/extend-expect";
import { render, screen, fireEvent } from "@testing-library/react";
import { Router } from "react-router-dom";
import {
  FormStatus,
  Form,
  EmitterType,
  Packagings,
  QuantityType,
  Consistence,
} from "generated/graphql/types";
import { MockedProvider } from "@apollo/react-testing";
import { createMemoryHistory } from "history";

const simpleForm: Form = {
  id: "abcd",
  isImportedFromPaper: false,
  updatedAt: "2020-11-02T00:00:00.000Z",
  actualQuantity: 1,
  noTraceability: false,
  nextDestination: null,
  customId: "XYZ777",
  sentAt: "2020-11-02T00:00:00.000Z",
  emitter: {
    type: EmitterType.Producer,
    pickupSite: "",
    workSite: {
      name: "",
      address: "",
      city: "",
      postalCode: "",
      infos: "",
    },
    company: {
      name: "Emitting Company",
      siret: "1234",
      address: "Emitting address",
      contact: "Emitting contact",
      country: "FR",
      phone: "06 11 12 13 14",
      mail: "emitter@foo.bar",
    },
  },
  recipient: {
    cap: "",
    processingOperation: "R 2",
    isTempStorage: false,
    company: {
      name: "Recipient Company",
      siret: "9876",
      address: "Recipient address",
      contact: "Recipient contact",
      country: "FR",
      phone: "06 99 88 77 66",
      mail: "recipient@foo.bar",
    },
  },
  transporter: {
    isExemptedOfReceipt: false,
    receipt: "receipt 123",
    department: "77",
    validityLimit: "2020-06-18T00:00:00.000Z",
    numberPlate: "",
    customInfo: "",
    company: {
      name: "Transporter company",
      siret: "6543",
      address: "Transporter address",
      contact: "Transporter contact",
      country: "FR",
      phone: "06 33 44 99 00",
      mail: "transporter@foo.bar",
    },
  },
  trader: {
    receipt: "",
    department: "",
    validityLimit: null,
    company: {
      name: "",
      siret: "",
      address: "",
      contact: "",
      country: "FR",
      phone: "",
      mail: "",
    },
  },
  wasteDetails: {
    code: "09 01 01*",
    name: "some waste",
    onuCode: "onu123",
    packagings: [],
    otherPackaging: null,
    numberOfPackages: 1,
    packagingInfos: [
      {
        type: Packagings.Fut,
        other: "",
        quantity: 1,
      },
    ],
    quantity: 24,
    quantityType: QuantityType.Estimated,
    consistence: Consistence.Liquid,
  },
  appendix2Forms: [],
  ecoOrganisme: null,
  temporaryStorageDetail: null,

  readableId: "TD-20-TCG6666",
  createdAt: "2020-11-02T09:38:05.393Z",
  status: FormStatus.Processed,
  stateSummary: {
    packagings: [Packagings.Fut],
    packagingInfos: [
      {
        type: Packagings.Fut,
        other: "",
        quantity: 1,
      },
    ],
    onuCode: "",
    quantity: 18.5,
    transporterNumberPlate: "",
    transporterCustomInfo: "",
    transporter: null,
    recipient: {
      name: "",
      siret: "",
      address: "",
      contact: "",
      country: "",
      phone: "",
      mail: "",
    },
    emitter: {
      name: "",
      siret: "",
      address: "",
      contact: "",
      country: "",
      phone: "",
      mail: "",
    },
    lastActionOn: "2020-11-18",
  },
  currentTransporterSiret: "",
  nextTransporterSiret: null,
  transportSegments: [],
  sentBy: "joe",
  signedByTransporter: false,
  processedAt: "2020-11-18",
  receivedAt: "2020-11-18T00:00:00.000Z",
  receivedBy: "joe le receveur",
  quantityReceived: 18.5,
  wasteAcceptationStatus: "ACCEPTED",
  wasteRefusalReason: "",
  signedAt: "2020-11-18T00:00:00.000Z",
  processedBy: "jim le traiteur",
  processingOperationDescription: "destructtion",
  processingOperationDone: "R 10",
};
const tempStorageForm: Form = {
  id: "xyz",
  isImportedFromPaper: false,
  updatedAt: "2020-11-02T00:00:00.000Z",
  actualQuantity: 1,
  noTraceability: false,
  nextDestination: null,
  customId: "XYZ999",
  sentAt: "2020-11-02T00:00:00.000Z",
  emitter: {
    type: EmitterType.Producer,
    pickupSite: "",
    workSite: {
      name: "",
      address: "",
      city: "",
      postalCode: "",
      infos: "",
    },
    company: {
      name: "Emitting Company",
      siret: "1234",
      address: "Emitting address",
      contact: "Emitting contact",
      country: "FR",
      phone: "06 11 12 13 14",
      mail: "emitter@foo.bar",
    },
  },
  recipient: {
    cap: "",
    processingOperation: "R 2",
    isTempStorage: true,
    company: {
      name: "Tempstorer Company",
      siret: "9876",
      address: "Tempstorer address",
      contact: "Tempstorer contact",
      country: "FR",
      phone: "06 99 88 77 66",
      mail: "tempstorer@foo.bar",
    },
  },
  transporter: {
    isExemptedOfReceipt: false,
    receipt: "receipt 123",
    department: "77",
    validityLimit: "2020-06-18T00:00:00.000Z",
    numberPlate: "",
    customInfo: "",
    company: {
      name: "Transporter company",
      siret: "6543",
      address: "Transporter address",
      contact: "Transporter contact",
      country: "FR",
      phone: "06 33 44 99 00",
      mail: "transporter@foo.bar",
    },
  },
  trader: {
    receipt: "",
    department: "",
    validityLimit: null,
    company: {
      name: "",
      siret: "",
      address: "",
      contact: "",
      country: "FR",
      phone: "",
      mail: "",
    },
  },
  wasteDetails: {
    code: "09 01 01*",
    name: "some waste",
    onuCode: "onu123",
    packagings: [],
    otherPackaging: null,
    numberOfPackages: 1,
    packagingInfos: [
      {
        type: Packagings.Fut,
        other: "",
        quantity: 1,
      },
    ],
    quantity: 24,
    quantityType: QuantityType.Estimated,
    consistence: Consistence.Liquid,
  },
  appendix2Forms: [],
  ecoOrganisme: null,
  temporaryStorageDetail: {
    signedBy: "",
    signedAt: "",
    temporaryStorer: {
      quantityType: QuantityType.Real,
      quantityReceived: 17,
      wasteAcceptationStatus: "ACCEPTED",
      wasteRefusalReason: "",
      receivedAt: "2020-11-01T00:00:00.000Z",
      receivedBy: "jim",
    },
    destination: {
      isFilledByEmitter: false,

      company: {
        name: "Final Recipient company",
        siret: "554433",
        address: "Recipient address",
        contact: "Recipient contact",
        country: "FR",
        phone: "06 77 22 66 55",
        mail: "recipient@foo.bar",
      },
      cap: "cap 1234",
      processingOperation: "D 5",
    },
    wasteDetails: {
      code: "",
      name: "",
      packagings: null,
      otherPackaging: null,
      numberOfPackages: 1,
      consistence: Consistence.Liquid,
      onuCode: "",
      packagingInfos: [],
      quantity: null,
      quantityType: QuantityType.Estimated,
    },
    transporter: {
      isExemptedOfReceipt: false,
      receipt: "qs",
      department: "11",
      validityLimit: "2020-11-12T00:00:00.000Z",
      numberPlate: "",
      customInfo: "",
      company: {
        name: "Transorter 2 company",
        siret: "81971435300011",
        address: "Le Castellas 83210 Solliès-Toucas",
        contact: "jean trasnpo",
        country: "FR",
        phone: "06 18 76 02 11",
        mail: "recipient@foo.bar",
      },
    },
  },

  readableId: "TD-20-TCG5555",
  createdAt: "2020-11-02T09:38:05.393Z",
  status: FormStatus.Processed,
  stateSummary: {
    packagings: [Packagings.Fut],
    packagingInfos: [
      {
        type: Packagings.Fut,

        other: "",
        quantity: 1,
      },
    ],
    onuCode: "",
    quantity: 18.5,
    transporterNumberPlate: "",
    transporterCustomInfo: "",
    transporter: null,
    recipient: {
      name: "",
      siret: "",
      address: "",
      contact: "",
      country: "",
      phone: "",
      mail: "",
    },
    emitter: {
      name: "",
      siret: "",
      address: "",
      contact: "",
      country: "",
      phone: "",
      mail: "",
    },
    lastActionOn: "2020-11-18",
  },
  currentTransporterSiret: "",
  nextTransporterSiret: null,
  transportSegments: [],
  sentBy: "joe",
  signedByTransporter: false,
  processedAt: "2020-11-18",
  receivedAt: "2020-11-18T00:00:00.000Z",
  receivedBy: "joe le receveur",
  quantityReceived: 18.5,
  wasteAcceptationStatus: "ACCEPTED",
  wasteRefusalReason: "",
  signedAt: "2020-11-18T00:00:00.000Z",
  processedBy: "jim le traiteur",
  processingOperationDescription: "destructtion",
  processingOperationDone: "R 10",
};

describe("<SlipDetailContent />", () => {
  it("should render a simple form", () => {
    const history = createMemoryHistory();
    const { getByText } = render(
      <MockedProvider>
        <Router history={history}>
          <SlipDetailContent form={simpleForm} />
        </Router>
      </MockedProvider>
    );
    expect(screen.getByText(/TD-20-TCG6666/)).toBeInTheDocument();
    expect(screen.getByText(/Traité/)).toBeInTheDocument();
    expect(screen.getByText(/Numéro libre: XYZ777/)).toBeInTheDocument();

    expect(screen.getByText(/Destinataire/)).toBeInTheDocument();

    // no temp storage, no tab
    expect(screen.queryByText(/Entr. Prov./)).not.toBeInTheDocument();

    // emitter tab
    expect(screen.getByText(/Emitting Company/)).toBeInTheDocument();

    // company other than emitter should not be visible
    expect(screen.queryByText(/Transporter Company/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Recipient Company/i)).not.toBeInTheDocument();

    // check transporter tab
    fireEvent(
      getByText("Transporteur", { selector: "li span" }),
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
      })
    );
    expect(screen.getByText(/Transporter Company/i)).toBeInTheDocument();

    // check recipient tab
    fireEvent(
      getByText("Destinataire"),
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
      })
    );
    expect(screen.getByText(/Recipient Company/i)).toBeInTheDocument();
  });

  it("should render a form with temp storage ", () => {
    const history = createMemoryHistory();
    const { getByText } = render(
      <MockedProvider>
        <Router history={history}>
          <SlipDetailContent form={tempStorageForm} />
        </Router>
      </MockedProvider>
    );
    expect(screen.getByText(/TD-20-TCG5555/)).toBeInTheDocument();
    expect(screen.getByText(/Traité/)).toBeInTheDocument();
    expect(screen.getByText(/Numéro libre: XYZ999/)).toBeInTheDocument();
    expect(screen.getByText(/Entr. Prov./)).toBeInTheDocument();
    expect(screen.getByText(/Destinataire/)).toBeInTheDocument();

    // emitter tab
    expect(screen.getByText(/Emitting Company/)).toBeInTheDocument();

    // company other than emitter should not be visible
    expect(screen.queryByText(/Tempstorer Company/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Transporter Company/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Final Recipient Company/i)
    ).not.toBeInTheDocument();

    // tab content is  not accessible, simulate clicks
    // check temp storage
    fireEvent(
      getByText("Entr. Prov."),
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
      })
    );
    expect(screen.getByText(/Tempstorer Company/i)).toBeInTheDocument();

    // check transporter tab
    fireEvent(
      getByText("Transporteur", { selector: "li span" }),
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
      })
    );
    expect(screen.getByText(/Transporter Company/i)).toBeInTheDocument();

    // check recipient tab
    fireEvent(
      getByText("Destinataire"),
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
      })
    );
    expect(screen.getByText(/Final Recipient Company/i)).toBeInTheDocument();
  });
});

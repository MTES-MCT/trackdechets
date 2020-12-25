import { initialCompany } from "form/initial-state";

export default {
  emitter: { company: initialCompany, agreement: "", validityLimit: null },
  recipient: {
    company: initialCompany,
    agreement: "",
    validityLimit: null,
    operation: { planned: "" },
  },
  wasteDetails: {
    packagingType: "UNIT",
    identificationNumbers: [],
    identificationType: "VHU_NUMBER",
    quantity: null,
    quantityUnit: "NUMBER",
  },
  transporter: {
    agreement: "",
    company: initialCompany,
    receipt: "",
    department: "",
    validityLimit: null,
    transportType: "",
  },
};

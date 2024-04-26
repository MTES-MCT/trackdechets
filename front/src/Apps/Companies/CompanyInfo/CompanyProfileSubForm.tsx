import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import Input from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/Select";
import { CompanyType } from "@td/codegen-ui";
import React from "react";
import { Highlight } from "@codegouvfr/react-dsfr/Highlight";

const CompanyProfileSubForm = ({ watch, register, field, formState }) => {
  const COMPOSED_COMPANY_TYPES = [
    CompanyType.WasteVehicles,
    CompanyType.Transporter,
    CompanyType.Broker,
    CompanyType.Trader,
    CompanyType.Worker
  ];
  const companyTypesValues = watch("companyTypes");
  const hasSubSectionThree = watch("workerCertification.hasSubSectionThree");
  const composedCompanyTypes = companyTypesValues
    .map(companyType => {
      if (
        companyType.isChecked &&
        COMPOSED_COMPANY_TYPES.includes(companyType.value as CompanyType)
      ) {
        return companyType.value;
      }
      return null;
    })
    .filter(f => f !== null);
  const isWasteVehicules = companyType =>
    companyType === field.value && companyType === CompanyType.WasteVehicles;
  const isTransporter = companyType =>
    companyType === field.value && companyType === CompanyType.Transporter;
  const isBroker = companyType =>
    companyType === field.value && companyType === CompanyType.Broker;
  const isTrader = companyType =>
    companyType === field.value && companyType === CompanyType.Trader;
  const isWorker = companyType =>
    companyType === field.value && companyType === CompanyType.Worker;

  return composedCompanyTypes.map(companyType => {
    if (isWasteVehicules(companyType)) {
      return (
        <div key={`${CompanyType.WasteVehicles}_nested`}>
          <Highlight>
            <p>
              <strong>Agrément broyeur VHU</strong>
            </p>
            <br />
            <Input
              label="Numéro de récépissé"
              nativeInputProps={{
                ...register("vhuAgrementBroyeur.agrementNumber")
              }}
            />
            <Input
              label="Département"
              nativeInputProps={{
                ...register("vhuAgrementBroyeur.department")
              }}
            />
            <br />
          </Highlight>

          <Highlight>
            <p>
              <strong>Agrément Demolisseur VHU</strong>
            </p>
            <br />
            <Input
              label="Numéro de récépissé"
              nativeInputProps={{
                ...register("vhuAgrementDemolisseur.agrementNumber")
              }}
            />
            <Input
              label="Département"
              nativeInputProps={{
                ...register("vhuAgrementDemolisseur.department")
              }}
            />
          </Highlight>
          <br />
        </div>
      );
    }
    if (isTransporter(companyType)) {
      return (
        <div key={`${CompanyType.Transporter}_nested`}>
          <Highlight>
            <p>
              <strong>Récépissé Transporteur</strong>
            </p>
            <br />
            <Input
              label="Numéro de récépissé"
              nativeInputProps={{
                ...register("transporterReceipt.receiptNumber")
              }}
            />
            <Input
              label="Limite de validité"
              nativeInputProps={{
                type: "date",
                ...register("transporterReceipt.validityLimit")
              }}
            />
            <Input
              label="Département"
              nativeInputProps={{
                ...register("transporterReceipt.department")
              }}
            />
          </Highlight>
          <br />
        </div>
      );
    }
    if (isBroker(companyType)) {
      return (
        <div key={`${CompanyType.Broker}_nested`}>
          <Highlight>
            <p>
              <strong>Récépissé courtier</strong>
            </p>
            <br />
            <Input
              label="Numéro de récépissé"
              nativeInputProps={{
                ...register("brokerReceipt.receiptNumber")
              }}
            />
            <Input
              label="Limite de validité"
              nativeInputProps={{
                type: "date",
                ...register("brokerReceipt.validityLimit")
              }}
            />
            <Input
              label="Département"
              nativeInputProps={{
                ...register("brokerReceipt.department")
              }}
            />
          </Highlight>
          <br />
        </div>
      );
    }
    if (isTrader(companyType)) {
      return (
        <div key={`${CompanyType.Trader}_nested`}>
          <Highlight>
            <p>
              <strong>Récépissé négociant</strong>
            </p>
            <br />
            <Input
              label="Numéro de récépissé"
              nativeInputProps={{
                ...register("traderReceipt.receiptNumber")
              }}
            />
            <Input
              label="Limite de validité"
              nativeInputProps={{
                type: "date",
                ...register("traderReceipt.validityLimit")
              }}
            />
            <Input
              label="Département"
              nativeInputProps={{
                ...register("traderReceipt.department")
              }}
            />
          </Highlight>
          <br />
        </div>
      );
    }
    if (isWorker(companyType)) {
      return (
        <div key={`${CompanyType.Worker}_nested`}>
          <Highlight>
            <p>
              <strong>Catégorie entreprise de travaux amiante</strong>
            </p>
            <br />

            <Checkbox
              options={[
                {
                  label: "Travaux relevant de la sous-section 4",
                  nativeInputProps: {
                    ...register("workerCertification.hasSubSectionFour")
                  }
                }
              ]}
            />
            <Checkbox
              options={[
                {
                  label: "Travaux relevant de la sous-section 3",
                  nativeInputProps: {
                    ...register("workerCertification.hasSubSectionThree")
                  }
                }
              ]}
            />
            {hasSubSectionThree && (
              <>
                <Input
                  label="N° certification"
                  nativeInputProps={{
                    ...register("workerCertification.certificationNumber", {
                      required: true
                    })
                  }}
                  state={
                    formState.errors.workerCertification?.certificationNumber
                      ? "error"
                      : "default"
                  }
                  stateRelatedMessage="Champ requis"
                />
                <Input
                  label="Date de validité"
                  nativeInputProps={{
                    type: "date",
                    ...register("workerCertification.validityLimit", {
                      required: true
                    })
                  }}
                  state={
                    formState.errors.workerCertification?.validityLimit
                      ? "error"
                      : "default"
                  }
                  stateRelatedMessage="Champ requis"
                />
                <Select
                  label="Organisme"
                  nativeSelectProps={{
                    ...register("workerCertification.organisation", {
                      required: true
                    })
                  }}
                  state={
                    formState.errors.workerCertification?.organisation
                      ? "error"
                      : "default"
                  }
                  stateRelatedMessage="Champ requis"
                >
                  <option value="..." disabled>
                    Sélectionnez une valeur...
                  </option>
                  <option value="AFNOR Certification">
                    AFNOR Certification
                  </option>
                  <option value="GLOBAL CERTIFICATION">
                    GLOBAL CERTIFICATION
                  </option>
                  <option value="QUALIBAT">QUALIBAT</option>
                </Select>
              </>
            )}
          </Highlight>
          <br />
        </div>
      );
    }

    return null;
  });
};
export default CompanyProfileSubForm;

import React from "react";
import {
  CompanyTypeInputErrors,
  CompanyTypeInputProps
} from "./CompanyTypeForm";
import Alert from "@codegouvfr/react-dsfr/Alert";
import RecepisseForm from "./RecepisseForm";

type TransporteurRecepisseFormProps = {
  inputProps: Pick<CompanyTypeInputProps, "transporterReceipt">;
  inputErrors: Pick<CompanyTypeInputErrors, "transporterReceipt">;
};

const TransporteurRecepisseForm: React.FC<TransporteurRecepisseFormProps> = ({
  inputProps,
  inputErrors
}) => {
  return (
    <div>
      <div className="fr-grid-row fr-mb-2w">
        <div className="fr-col-12">
          <Alert
            title=""
            description={
              <>
                Ce profil comprend les entreprises de transport routier
                immatriculées au registre national des transports, et les
                établissements disposant d'une flotte en propre, disposant dans
                les 2 cas d'un récépissé de déclaration de transport de déchets
                ou qui répondent à l'exemption de récépissé.
              </>
            }
            severity="info"
          />
        </div>
      </div>
      <RecepisseForm
        title="Récépissé Transporteur (optionnel)"
        inputProps={inputProps.transporterReceipt}
        inputErrors={inputErrors.transporterReceipt}
      />
    </div>
  );
};

export default React.memo(TransporteurRecepisseForm);

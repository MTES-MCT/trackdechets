import React from "react";
import { BsdaTransporter } from "../../../generated/graphql/types";
import { CompanyContact, CompanyDescription } from "./Company";
import { Recepisse } from "./Recepisse";
import { TRANSPORT_MODE_LABELS, formatDate } from "../../../common/pdf";
import { Signature } from "./Signature";

type TransporterProps = {
  transporter: BsdaTransporter;
};

const Transporter: React.FC<TransporterProps> = ({ transporter }) => {
  return (
    <div className="BoxRow">
      <div className="BoxCol">
        <p>
          <strong>6. Transporteur</strong>
        </p>
        <CompanyDescription company={transporter?.company} />
        <CompanyContact company={transporter?.company} />
      </div>
      <div className="BoxCol">
        {transporter?.recepisse?.isExempted ? (
          <p>
            Le transporteur déclare être exempté de récépissé conformément aux
            dispositions de l'article R.541-50 du code de l'environnement.
          </p>
        ) : (
          <Recepisse recepisse={transporter?.recepisse} />
        )}
        <br />
        Mode de transport :{" "}
        {transporter?.transport?.mode
          ? TRANSPORT_MODE_LABELS[transporter?.transport?.mode]
          : ""}
        <br />
        Immatriculations: {transporter?.transport?.plates?.join(", ")}
        <br />
        Date de prise en charge:{" "}
        {formatDate(transporter?.transport?.takenOverAt)}
        <br />
        <Signature signature={transporter?.transport?.signature} />
      </div>
    </div>
  );
};

export default Transporter;

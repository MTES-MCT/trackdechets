import * as React from "react";
import { CreateOrUpdateTransporterInput } from "../../../../form/bsdd/utils/initial-state";
import { formatDate } from "../../../../common/datetime";

import "./TransporterDisplay.scss";

type TransporterFieldProps = {
  label: string;
  value?: string | null;
};

type TransporterProps = {
  transporter: CreateOrUpdateTransporterInput;
};

function TransporterField({ label, value }: TransporterFieldProps) {
  return (
    <div>
      <div>{label}</div>
      <div>
        <b>{value}</b>
      </div>
    </div>
  );
}

/**
 * Ce composant permet de représenter les données d'un transporteur
 * dans la liste des transporteurs lorsque la prise en charge du déchet
 * a déjà été effectuée (`takenOverAt` non nul) et que les champs du
 * formulaire ne sont par conséquent plus modifiables.
 */
export default function TransporterDisplay({ transporter }: TransporterProps) {
  return (
    <div className="fr-container--fluid">
      <div className="fr-grid-row fr-grid-row--gutters ">
        <div className="fr-col-12 fr-col-md-4">
          <TransporterField
            label="Raison sociale"
            value={transporter.company?.name}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <TransporterField
            label={
              transporter.company?.vatNumber
                ? "N°TVA intracommunautaire"
                : "SIRET"
            }
            value={transporter.company?.siret ?? transporter.company?.vatNumber}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <TransporterField
            label="Adresse"
            value={transporter.company?.address}
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters ">
        <div className="fr-col-12 fr-col-md-4">
          <TransporterField
            label="Contact"
            value={transporter.company?.contact}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <TransporterField
            label="Téléphone"
            value={transporter.company?.phone}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <TransporterField label="E-mail" value={transporter.company?.mail} />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters ">
        <div className="fr-col-12 fr-col-md-4">
          <TransporterField label="Récépissé n°" value={transporter.receipt} />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <TransporterField
            label="Récépissé département"
            value={transporter.department}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <TransporterField
            label="Récépissé valide jusqu'au"
            value={
              transporter.validityLimit
                ? formatDate(transporter.validityLimit)
                : ""
            }
          />
        </div>
      </div>
      <div className="fr-grid-row fr-grid-row--gutters ">
        <div className="fr-col-12 fr-col-md-4">
          <TransporterField
            label="Mode de transport"
            value={transporter.mode}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <TransporterField
            label="Immatriculation"
            value={transporter.numberPlate}
          />
        </div>
        <div className="fr-col-12 fr-col-md-4">
          <TransporterField
            label="Date de prise en charge"
            value={
              transporter.takenOverAt ? formatDate(transporter.takenOverAt) : ""
            }
          />
        </div>
      </div>
    </div>
  );
}

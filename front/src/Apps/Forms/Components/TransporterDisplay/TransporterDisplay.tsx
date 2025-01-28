import * as React from "react";
import { formatDate } from "../../../../common/datetime";
import "./TransporterDisplay.scss";
import { BsdTransporterInput } from "../../types";
import { TransportMode } from "@td/codegen-ui";
import { transportModeLabels } from "../../../../dashboard/constants";

type TransporterFieldProps = {
  label: string;
  value?: string | null;
};

type TransporterProps = {
  transporter: BsdTransporterInput;
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
      {(!transporter.recepisse?.isExempted ||
        transporter.company?.vatNumber ||
        !transporter.transport?.mode?.includes(TransportMode.Road)) && (
        <div className="fr-grid-row fr-grid-row--gutters ">
          <div className="fr-col-12 fr-col-md-4">
            <TransporterField
              label="Récépissé n°"
              value={transporter.recepisse?.number}
            />
          </div>
          <div className="fr-col-12 fr-col-md-4">
            <TransporterField
              label="Récépissé département"
              value={transporter.recepisse?.department}
            />
          </div>
          <div className="fr-col-12 fr-col-md-4">
            <TransporterField
              label="Récépissé valide jusqu'au"
              value={
                transporter.recepisse?.validityLimit
                  ? formatDate(transporter.recepisse?.validityLimit)
                  : ""
              }
            />
          </div>
        </div>
      )}
      {transporter.recepisse?.isExempted && (
        <div className="fr-grid-row fr-grid-row--gutters ">
          <div className="fr-col-12 fr-col-md-4">
            <TransporterField label="Exemption de récépissé" value="Oui" />
          </div>
        </div>
      )}
      <div className="fr-grid-row fr-grid-row--gutters ">
        {transporter?.transport?.mode && (
          <div className="fr-col-12 fr-col-md-4">
            <TransporterField
              label="Mode de transport"
              value={transportModeLabels[transporter.transport.mode]}
            />
          </div>
        )}
        <div className="fr-col-12 fr-col-md-4">
          <TransporterField
            label="Immatriculation"
            value={transporter.transport?.plates?.[0]}
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

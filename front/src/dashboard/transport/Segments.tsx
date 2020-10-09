import React from "react";
import { transportModeLabels } from "../constants";
import styles from  "./Transport.module.scss";
const verboseTakenOver = ({ segment, userSiret }) => {
  if (!!segment.takenOverAt) {
    return segment.transporter.company.siret === userSiret
      ? `Chargé`
      : `Transmis à ${segment.transporter.company.name}`;
  }
  return segment.readyToTakeOver ? "Prêt à transférer" : "Brouillon";
};

export const Segments = ({ form, userSiret }) => {
  const transportSegments = form.transportSegments || [];
  if (!transportSegments.length) {
    return null;
  }

  return (
    <div>
      <strong>Segments</strong>
      {/*  sticking to table because of incomplete IE grid layout support */}
      <table>
        <thead>
          <tr>
            <th>N°</th>
            <th>Mode</th>
            <th>Transporteur</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {form.transportSegments.map(segment =>
            !!segment.id ? (
              <tr key={segment.id}>
                <td>
                  <span className={styles.segmentPill}>{segment.segmentNumber}</span>
                </td>
                <td>{segment.mode && transportModeLabels[segment.mode]}</td>
                <td> {segment.transporter.company.name}</td>

                <td>{verboseTakenOver({ segment, userSiret })}</td>
              </tr>
            ) : null
          )}
        </tbody>
      </table>
    </div>
  );
};

import React, { useState } from "react";
import { transportModeLabels } from "../constants";
import styles from "./Transport.module.scss";
import { Modal, ModalTitle } from "common/components";
import { OutlineButton } from "common/components/ActionButton";

const verboseTakenOver = ({ segment, userSiret }) => {
  if (!!segment.takenOverAt) {
    return segment.transporter.company.siret === userSiret
      ? `Chargé`
      : `Transmis à ${segment.transporter.company.name}`;
  }
  return segment.readyToTakeOver ? "Prêt à transférer" : "Brouillon";
};

export const Segments = ({ form, userSiret, inCard = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  const transportSegments = form.transportSegments || [];
  if (!transportSegments.length) {
    return null;
  }

  return (
    <div>
      {inCard ? (
        <button
          className="btn btn--outline-primary btn--small"
          onClick={() => setIsOpen(true)}
          title="Multimodal"
        >
          <span>{transportSegments.length} Segment(s)</span>
        </button>
      ) : (
        <OutlineButton
          title={`Multimodal (${transportSegments.length})`}
          onClick={() => setIsOpen(true)}
        />
      )}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        ariaLabel="Signature transporteur"
      >
        <ModalTitle>Segments</ModalTitle>

        {/*  sticking to table because of incomplete IE grid layout support */}
        <table className="td-table">
          <thead>
            <tr className="td-table__head-tr">
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
                    <span className={styles.segmentPill}>
                      {segment.segmentNumber}
                    </span>
                  </td>
                  <td>{segment.mode && transportModeLabels[segment.mode]}</td>
                  <td> {segment.transporter.company.name}</td>

                  <td>{verboseTakenOver({ segment, userSiret })}</td>
                </tr>
              ) : null
            )}
          </tbody>
        </table>
      </Modal>
    </div>
  );
};

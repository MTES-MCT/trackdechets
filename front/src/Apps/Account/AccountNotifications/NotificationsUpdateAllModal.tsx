import React from "react";

type AccountNotificationsUpdateAllModalProps = {
  // nombre total d'établissements
  totalCount: number;
};

export default function AccountNotificationsUpdateAllModal({
  totalCount
}: AccountNotificationsUpdateAllModalProps) {
  return (
    <div className="fr-mb-1w">
      {/* TODO implémenter les actions en masse dans cette modale */}
      Mise à jour en masse de {totalCount} établissements
    </div>
  );
}

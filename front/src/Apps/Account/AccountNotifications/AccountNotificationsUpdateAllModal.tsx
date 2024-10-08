import React from "react";

type AccountNotificationsUpdateAllModalProps = {
  // nombre total d'établissements
  totalCount: number;
};

export default function AccountNotificationsUpdateAllModal({
  totalCount
}: AccountNotificationsUpdateAllModalProps) {
  return (
    <div style={{ marginTop: 10 }}>
      Mise à jour en masse de {totalCount} établissements
    </div>
  );
}

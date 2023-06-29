import * as React from "react";
import { generatePath, useParams, useLocation } from "react-router-dom";
import routes from "Apps/routes";
import { useBsdasriDuplicate } from "./useDuplicate";
import { DeleteBsdasriModal } from "./DeleteModal";

import {
  IconTrash,
  IconView,
  IconPaperWrite,
  IconDuplicateFile,
  IconPdf,
  IconQrCode,
} from "common/components/Icons";
import { Bsdasri, BsdasriStatus, BsdasriType } from "generated/graphql/types";
import { useDownloadPdf } from "./useDownloadPdf";
import styles from "../../BSDActions.module.scss";
import { Loader } from "Apps/common/Components";
import DropdownMenu from "Apps/common/Components/DropdownMenu/DropdownMenu";
import { useDisplayRoadControlButton } from "../../RoadControlButton";

interface BSDAsriActionsProps {
  form: Bsdasri;
}

export const BSDAsriActions = ({ form }: BSDAsriActionsProps) => {
  const { siret } = useParams<{ siret: string }>();
  const location = useLocation();
  const [duplicateBsdasri, { loading }] = useBsdasriDuplicate({
    variables: { id: form.id },
  });
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [downloadPdf] = useDownloadPdf({ variables: { id: form.id } });

  const status = form["bsdasriStatus"];
  const emitterSiret = form.emitter?.company?.siret;
  const canDelete =
    status === BsdasriStatus.Initial ||
    (status === BsdasriStatus.SignedByProducer && siret === emitterSiret);

  const links = [
    {
      title: "Contrôle routier",
      route: {
        pathname: generatePath(routes.dashboard.roadControl, {
          siret,
          id: form.id,
        }),
        state: { background: location },
      },
      icon: <IconQrCode color="blueLight" size="24px" />,
      isVisible: useDisplayRoadControlButton(form),
    },
    {
      title: "Aperçu",
      route: {
        pathname: generatePath(routes.dashboard.bsdasris.view, {
          siret,
          id: form.id,
        }),
        state: { background: location },
      },
      icon: <IconView color="blueLight" size="24px" />,
      isVisible: true,
    },
    {
      title: "Pdf",
      route: "",
      icon: <IconPdf size="24px" color="blueLight" />,
      isVisible: !form.isDraft,
      isButton: true,
      handleClick: () => downloadPdf(),
    },
    {
      title: "Dupliquer",
      route: "",
      icon: <IconDuplicateFile size="24px" color="blueLight" />,
      isVisible: form.type === BsdasriType.Simple,
      isButton: true,
      handleClick: () => duplicateBsdasri(),
    },
    {
      title: "Modifier",
      route: generatePath(routes.dashboard.bsdasris.edit, {
        siret,
        id: form.id,
      }),
      icon: <IconPaperWrite size="24px" color="blueLight" />,
      isVisible: ![BsdasriStatus.Processed, BsdasriStatus.Refused].includes(
        status
      ),
    },
    {
      title: "Supprimer",
      route: "",
      icon: <IconTrash color="blueLight" size="24px" />,
      isVisible: canDelete,
      isButton: true,
      handleClick: () => setIsDeleting(true),
    },
  ];

  return (
    <>
      <div className={styles.BSDActions}>
        <DropdownMenu
          menuTitle="Actions"
          links={links.filter(f => f.isVisible)}
          iconAlone
        />
      </div>
      {loading && <Loader />}
      {isDeleting && (
        <DeleteBsdasriModal
          isOpen
          onClose={() => setIsDeleting(false)}
          formId={form.id}
        />
      )}
    </>
  );
};

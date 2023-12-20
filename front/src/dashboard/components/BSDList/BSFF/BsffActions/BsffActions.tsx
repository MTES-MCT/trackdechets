import * as React from "react";
import { generatePath, useParams, useLocation } from "react-router-dom";

import routes from "../../../../../Apps/routes";
import {
  IconView,
  IconPaperWrite,
  IconPdf,
  IconTrash,
  IconDuplicateFile,
  IconQrCode
} from "../../../../../Apps/common/Components/Icons/Icons";
import { BsffStatus } from "codegen-ui";
import { BsffFragment } from "../types";
import { DeleteBsffModal } from "./DeleteModal";
import { useDownloadPdf } from "./useDownloadPdf";
import { useDisplayRoadControlButton } from "../../RoadControlButton";
import { useDuplicate } from "./useDuplicate";

import styles from "../../BSDActions.module.scss";
import { Loader } from "../../../../../Apps/common/Components";
import DropdownMenu from "../../../../../Apps/common/Components/DropdownMenu/DropdownMenu";

interface BsffActionsProps {
  form: BsffFragment;
}

export const BsffActions = ({ form }: BsffActionsProps) => {
  const { siret } = useParams<{ siret: string }>();
  const location = useLocation();

  const [duplicateBsff, { loading: isDuplicating }] = useDuplicate({
    variables: { id: form.id }
  });
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [downloadPdf] = useDownloadPdf({ variables: { id: form.id } });

  const emitterSiret = form.bsffEmitter?.company?.siret;

  const canDelete =
    form.bsffStatus === BsffStatus.Initial ||
    (form.bsffStatus === BsffStatus.SignedByEmitter && siret === emitterSiret);

  const links = [
    {
      title: "Contrôle routier",
      route: generatePath(routes.dashboard.roadControl, {
        siret,
        id: form.id
      }),
      state: { background: location },
      icon: <IconQrCode color="blueLight" size="24px" />,
      isVisible: useDisplayRoadControlButton(form)
    },
    {
      title: "Aperçu",
      route: generatePath(routes.dashboard.bsffs.view, {
        siret,
        id: form.id
      }),
      state: { background: location },
      icon: <IconView color="blueLight" size="24px" />,
      isVisible: true
    },
    {
      title: "Pdf",
      route: "",
      icon: <IconPdf size="24px" color="blueLight" />,
      isVisible: !form.isDraft,
      isButton: true,
      handleClick: () => downloadPdf()
    },
    {
      title: "Dupliquer",
      route: "",
      icon: <IconDuplicateFile size="24px" color="blueLight" />,
      isVisible: true,
      isButton: true,
      handleClick: () => duplicateBsff()
    },
    {
      title: "Modifier",
      route: generatePath(routes.dashboard.bsffs.edit, {
        siret,
        id: form.id
      }),
      icon: <IconPaperWrite size="24px" color="blueLight" />,
      isVisible: [BsffStatus.Initial, BsffStatus.SignedByEmitter].includes(
        form.bsffStatus
      )
    },
    {
      title: "Supprimer",
      route: "",
      icon: <IconTrash color="blueLight" size="24px" />,
      isVisible: canDelete,
      isButton: true,
      handleClick: () => setIsDeleting(true)
    }
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

      {isDeleting && (
        <DeleteBsffModal
          isOpen
          onClose={() => setIsDeleting(false)}
          formId={form.id}
        />
      )}
      {isDuplicating && <Loader />}
    </>
  );
};

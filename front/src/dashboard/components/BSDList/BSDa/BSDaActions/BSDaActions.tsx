import * as React from "react";
import { generatePath, useParams, useLocation } from "react-router-dom";
import routes from "common/routes";
import {
  IconView,
  IconPaperWrite,
  IconPdf,
  IconDuplicateFile,
  IconTrash,
  IconQrCode,
} from "common/components/Icons";
import { Bsda, BsdaStatus } from "generated/graphql/types";
import { DeleteBsdaModal } from "./DeleteModal";
import { useDownloadPdf } from "./useDownloadPdf";
import { useDuplicate } from "./useDuplicate";
import { useDisplayRoadControlButton } from "../../RoadControlButton";

import styles from "../../BSDActions.module.scss";
import { Loader } from "common/components";
import DropdownMenu from "Apps/Common/Components/DropdownMenu/DropdownMenu";

interface BSdaActionsProps {
  form: Bsda;
}

export const BSDaActions = ({ form }: BSdaActionsProps) => {
  const { siret } = useParams<{ siret: string }>();
  const location = useLocation();

  const [duplicateBsda, { loading }] = useDuplicate({
    variables: { id: form.id },
  });
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [downloadPdf] = useDownloadPdf({ variables: { id: form.id } });

  const canDelete =
    form["bsdaStatus"] === BsdaStatus.Initial ||
    (form["bsdaStatus"] === BsdaStatus.SignedByProducer &&
      form.emitter?.company?.siret === siret);

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
        pathname: generatePath(routes.dashboard.bsdas.view, {
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
      isVisible: true,
      isButton: true,
      handleClick: () => duplicateBsda(),
    },
    {
      title: "Modifier",
      route: generatePath(routes.dashboard.bsdas.edit, {
        siret,
        id: form.id,
      }),
      icon: <IconPaperWrite size="24px" color="blueLight" />,
      isVisible: ![
        BsdaStatus.Processed,
        BsdaStatus.Refused,
        BsdaStatus.AwaitingChild,
      ].includes(form["bsdaStatus"]),
    },
    {
      title: "Supprimer",
      route: "",
      icon: <IconTrash color="blueLight" size="24px" />,
      isVisible: canDelete,
      isButton: true,
      handleClick: () => setIsDeleting(true),
    },
    {
      title: "Révision",
      route: {
        pathname: generatePath(routes.dashboard.bsdas.review, {
          siret,
          id: form.id,
        }),
        state: { background: location },
      },
      icon: <IconPaperWrite size="24px" color="blueLight" />,

      isVisible: !canDelete,
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
        <DeleteBsdaModal
          isOpen
          onClose={() => setIsDeleting(false)}
          formId={form.id}
        />
      )}
    </>
  );
};

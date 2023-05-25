import * as React from "react";
import {
  generatePath,
  useParams,
  useLocation,
  useRouteMatch,
} from "react-router-dom";

import routes from "common/routes";
import {
  IconView,
  IconPaperWrite,
  IconPdf,
  IconDuplicateFile,
  IconTrash,
  IconQrCode,
} from "common/components/Icons";
import { Bsvhu, BsvhuStatus } from "generated/graphql/types";
import { DeleteBsvhuModal } from "./DeleteModal";
import { useDownloadPdf } from "./useDownloadPdf";
import { useDuplicate } from "./useDuplicate";
import { useDisplayRoadControlButton } from "../../RoadControlButton";

import styles from "../../BSDActions.module.scss";
import { Loader } from "common/components";
import DropdownMenu from "Apps/Common/Components/DropdownMenu/DropdownMenu";

interface BSVhuActionsProps {
  form: Bsvhu;
}

export const BSVhuActions = ({ form }: BSVhuActionsProps) => {
  const { siret } = useParams<{ siret: string }>();
  const location = useLocation();

  const [duplicateBsvhu, { loading: isDuplicating }] = useDuplicate({
    variables: { id: form.id },
  });
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [downloadPdf] = useDownloadPdf({ variables: { id: form.id } });

  const emitterSiret = form.emitter?.company?.siret;

  const status = form["bsvhuStatus"];

  const canDelete =
    status === BsvhuStatus.Initial ||
    (status === BsvhuStatus.SignedByProducer && siret === emitterSiret);

  const isV2Routes = !!useRouteMatch("/v2/dashboard/");
  const dashboardRoutePrefix = !isV2Routes ? "dashboard" : "dashboardv2";

  const links = [
    {
      title: "Contrôle routier",
      route: {
        pathname: generatePath(routes[dashboardRoutePrefix].roadControl, {
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
        pathname: generatePath(routes[dashboardRoutePrefix].bsvhus.view, {
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
      handleClick: () => duplicateBsvhu(),
    },
    {
      title: "Modifier",
      route: generatePath(routes[dashboardRoutePrefix].bsvhus.edit, {
        siret,
        id: form.id,
      }),
      icon: <IconPaperWrite size="24px" color="blueLight" />,
      isVisible: ![BsvhuStatus.Processed, BsvhuStatus.Refused].includes(status),
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

      {isDeleting && (
        <DeleteBsvhuModal
          isOpen
          onClose={() => setIsDeleting(false)}
          formId={form.id}
        />
      )}
      {isDuplicating && <Loader />}
    </>
  );
};

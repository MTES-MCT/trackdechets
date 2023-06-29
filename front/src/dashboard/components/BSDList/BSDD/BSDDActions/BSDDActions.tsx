import * as React from "react";
import { generatePath, useParams, useLocation } from "react-router-dom";

import routes from "Apps/routes";
import {
  IconAddCircle,
  IconDuplicateFile,
  IconPaperWrite,
  IconPdf,
  IconQrCode,
  IconTrash,
  IconView,
} from "common/components/Icons";
import { EmitterType, Form, FormStatus } from "generated/graphql/types";
import { DeleteModal } from "./DeleteModal";
import { useDuplicate } from "./useDuplicate";
import { useDownloadPdf } from "./useDownloadPdf";
import styles from "../../BSDActions.module.scss";
import { Loader } from "Apps/common/Components";
import { useDisplayRoadControlButton } from "../../RoadControlButton";
import DropdownMenu from "Apps/common/Components/DropdownMenu/DropdownMenu";

interface BSDDActionsProps {
  form: Form;
}

export const BSDDActions = ({ form }: BSDDActionsProps) => {
  const { siret } = useParams<{ siret: string }>();
  const location = useLocation();
  const [downloadPdf] = useDownloadPdf({ variables: { id: form.id } });
  const [duplicateForm, { loading: isDuplicating }] = useDuplicate({
    variables: { id: form.id },
  });
  const [isDeleting, setIsDeleting] = React.useState(false);

  let canDelete = [FormStatus.Draft, FormStatus.Sealed].includes(form.status);

  if (form.status === FormStatus.SignedByProducer) {
    // if the bsd is only signed by the emitter, they can still update/delete it
    // so if it's signed by the emitter, they can do it but not the eco organisme
    // if it's signed by the eco organisme, they can do it but not the emitter
    const signedBySiret = form.emittedByEcoOrganisme
      ? form.ecoOrganisme?.siret
      : form.emitter?.company?.siret;
    canDelete = siret === signedBySiret;
  }

  const canUpdate = [
    FormStatus.Draft,
    FormStatus.Sealed,
    FormStatus.SignedByProducer,
  ].includes(form.status);

  const isAppendix1 = form.emitter?.type === EmitterType.Appendix1;
  const isAppendix1Producer =
    form.emitter?.type === EmitterType.Appendix1Producer;
  const showAppendix1Button =
    isAppendix1 && [FormStatus.Sealed, FormStatus.Sent].includes(form.status);

  const canRequestRevision =
    ![FormStatus.Draft, FormStatus.Sealed, FormStatus.Refused].includes(
      form.status
    ) && !isAppendix1Producer;

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
        pathname: generatePath(routes.dashboard.bsdds.view, {
          siret,
          id: form.id,
        }),
        state: { background: location },
      },
      icon: <IconView color="blueLight" size="24px" />,
      isVisible: true,
    },
    {
      title: "Annexe 1",
      route: {
        pathname: generatePath(routes.dashboard.bsdds.view, {
          siret,
          id: form.id,
        }),
        search: "?selectedTab=0",
        state: { background: location },
      },
      icon: <IconAddCircle size="24px" color="blueLight" />,
      isVisible: showAppendix1Button,
    },

    {
      title: "Pdf",
      route: "",
      icon: <IconPdf size="24px" color="blueLight" />,
      isVisible: form.status !== FormStatus.Draft,
      isButton: true,
      handleClick: () => downloadPdf(),
    },
    {
      title: "Dupliquer",
      route: "",
      icon: <IconDuplicateFile size="24px" color="blueLight" />,
      isVisible: !isAppendix1Producer,
      isButton: true,
      handleClick: () => duplicateForm(),
    },
    {
      title: "Modifier",
      route: generatePath(routes.dashboard.bsdds.edit, {
        siret,
        id: form.id,
      }),
      icon: <IconPaperWrite size="24px" color="blueLight" />,
      isVisible: canUpdate && !isAppendix1Producer,
    },
    {
      title: "Révision",
      route: {
        pathname: generatePath(routes.dashboard.bsdds.review, {
          siret,
          id: form.id,
        }),
        state: { background: location },
      },
      icon: <IconPaperWrite size="24px" color="blueLight" />,
      isVisible: canRequestRevision,
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
        <DeleteModal
          isOpen
          onClose={() => setIsDeleting(false)}
          formId={form.id}
        />
      )}
      {isDuplicating && <Loader />}
    </>
  );
};

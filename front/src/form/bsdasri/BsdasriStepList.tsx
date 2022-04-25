import { useMutation, useQuery } from "@apollo/client";
import cogoToast from "cogo-toast";
import routes from "common/routes";
import GenericStepList, {
  getComputedState,
} from "form/common/stepper/GenericStepList";

import { IStepContainerProps } from "form/common/stepper/Step";
import {
  Mutation,
  MutationCreateBsdasriArgs,
  MutationCreateDraftBsdasriArgs,
  MutationUpdateBsdasriArgs,
  QueryBsdasriArgs,
  Query,
  Bsdasri,
  BsdasriInput,
  BsdasriStatus,
  BsdasriType,
} from "generated/graphql/types";
import omitDeep from "omit-deep-lodash";
import React, { ReactElement, useMemo } from "react";
import { generatePath, useHistory, useParams } from "react-router-dom";
import getInitialState from "./utils/initial-state";
import {
  CREATE_DRAFT_BSDASRI,
  CREATE_BSDASRI,
  GET_BSDASRI,
  UPDATE_BSDASRI,
} from "./utils/queries";

interface Props {
  children: (dasriForm: Bsdasri | undefined) => ReactElement;
  formId?: string;
  initialStep?: number;
  bsdasriFormType?: string;
}

const wasteKey = "waste";
const ecoOrganismeKey = "ecoOrganisme";
const emitterKey = "emitter";
const transporterKey = "transporter";
const destinationKey = "destination";
const identificationKey = "identification";
const synthesizingKey = "synthesizing";
const groupingKey = "grouping";
const transporterCompanySiretKey = "transporter.company.siret";
const transporterCompanyVatNumberKey = "transporter.company.vatNumber";
const transporterTransportPackagingsKey = "transporter.transport.packagings";
const transporterTransportVolumeKey = "transporter.transport.volume";

const getCommonKeys = (bsdasriType: BsdasriType): string[] => {
  if (bsdasriType === BsdasriType.Synthesis) {
    return [
      groupingKey,
      transporterCompanySiretKey,
      transporterCompanyVatNumberKey,
      transporterTransportPackagingsKey,
      transporterTransportVolumeKey,
    ];
  }
  if (bsdasriType === BsdasriType.Grouping) {
    return [synthesizingKey];
  }
  if (bsdasriType === BsdasriType.Simple) {
    return [synthesizingKey, groupingKey];
  }
  return [];
};
/**
 * Do not resend sections locked by relevant signatures
 */
const removeSections = (
  input: BsdasriInput,
  status: BsdasriStatus,
  bsdasriType: BsdasriType
) => {
  const commonKeys = getCommonKeys(bsdasriType);
  const mapping: Partial<Record<BsdasriStatus, string[]>> = {
    INITIAL: [...commonKeys],
    SIGNED_BY_PRODUCER: [
      wasteKey,
      ecoOrganismeKey,
      emitterKey,
      synthesizingKey,
      groupingKey,
      ...commonKeys,
    ],
    SENT: [
      wasteKey,
      ecoOrganismeKey,
      emitterKey,
      transporterKey,
      synthesizingKey,
      groupingKey,
      ...commonKeys,
    ],
    RECEIVED: [
      wasteKey,
      ecoOrganismeKey,
      emitterKey,
      transporterKey,
      destinationKey,
      identificationKey,
      synthesizingKey,
      groupingKey,
      ...commonKeys,
    ],
  };
  return omitDeep(input, mapping[status]);
};
export default function BsdasriStepsList(props: Props) {
  const { siret } = useParams<{ siret: string }>();
  const history = useHistory();

  const formQuery = useQuery<Pick<Query, "bsdasri">, QueryBsdasriArgs>(
    GET_BSDASRI,
    {
      variables: {
        id: props.formId!,
      },
      skip: !props.formId,
      fetchPolicy: "network-only",
    }
  );

  // prefill packaging info with previous dasri actor data
  const prefillWasteDetails = dasri => {
    if (!dasri?.transporter?.transport?.packagings?.length) {
      dasri.transporter.transport.packagings =
        dasri?.emitter?.emission?.packagings;
    }

    if (!dasri?.destination?.reception?.packagings?.length) {
      dasri.destination.reception.packagings =
        dasri?.transporter?.transport?.packagings;
    }
    return dasri;
  };
  const mapRegrouped = dasri => ({
    ...dasri,
    grouping: dasri?.grouping.map(d => d.id),
    synthesizing: dasri?.synthesizing?.map(d => d.id),
  });

  const formState = useMemo(
    () =>
      prefillWasteDetails(
        getComputedState(
          getInitialState(),
          mapRegrouped(formQuery.data?.bsdasri)
        )
      ),
    [formQuery.data]
  );

  const status = formState.id
    ? formQuery?.data?.bsdasri?.["bsdasriStatus"]
    : "INITIAL";

  const [createDraftBsdasri] = useMutation<
    Pick<Mutation, "createDraftBsdasri">,
    MutationCreateDraftBsdasriArgs
  >(CREATE_DRAFT_BSDASRI);

  const [createBsdasri] = useMutation<
    Pick<Mutation, "createBsdasri">,
    MutationCreateBsdasriArgs
  >(CREATE_BSDASRI);

  const [updateBsdasri] = useMutation<
    Pick<Mutation, "updateBsdasri">,
    MutationUpdateBsdasriArgs
  >(UPDATE_BSDASRI);

  function saveForm(
    input: BsdasriInput,
    type: BsdasriType = BsdasriType.Simple
  ): Promise<any> {
    if (formState.id) {
      if (type === BsdasriType.Synthesis) {
        // synthesis bsdasri are  never created in draft state
        const { grouping, emitter, ecoOrganisme, ...cleanedInput } = input;
        return updateBsdasri({
          variables: {
            id: formState.id,
            input: removeSections(cleanedInput, status, type),
          },
        });
      }
      return updateBsdasri({
        variables: {
          id: formState.id,
          input: removeSections(input, status, type),
        },
      });
    }

    if (type === BsdasriType.Synthesis) {
      const cleanedInput = omitDeep(input, [
        groupingKey,
        emitterKey,
        ecoOrganismeKey,
        transporterTransportPackagingsKey,
      ]);
      // synthesis bsdasri are  never created in draft state
      return createBsdasri({ variables: { input: cleanedInput } });
    }
    return createDraftBsdasri({ variables: { input: input } });
  }

  function onSubmit(values) {
    const { id, type, ...input } = values;
    if (
      type === BsdasriType.Grouping ||
      formQuery.data?.bsdasri?.type === "GROUPING"
    ) {
      if (!values?.grouping?.length) {
        cogoToast.error("Vous devez sélectionner des bordereaux à grouper", {
          hideAfter: 7,
        });
        return;
      }
    }

    saveForm(input, type)
      .then(_ => {
        // TODO  redirect to the correct dashboard
        const redirectTo = generatePath(routes.dashboard.bsds.drafts, {
          siret,
        });
        history.push(redirectTo);
      })
      .catch(err => {
        err.graphQLErrors.length &&
          err.graphQLErrors.map(err =>
            cogoToast.error(err.message, { hideAfter: 7 })
          );
        err.message && cogoToast.error(err.message, { hideAfter: 7 });
      });
  }

  // As it's a render function, the steps are nested into a `<></>` block
  // So we render then unwrap to get the steps

  const parentOfSteps = props.children(formQuery.data?.bsdasri);
  const steps = parentOfSteps.props.children as ReactElement<
    IStepContainerProps
  >[];

  if ([BsdasriStatus.Processed, BsdasriStatus.Refused].includes(status)) {
    return <p>Ce bordereau n'est plus modifiable</p>;
  }
  return (
    <GenericStepList
      children={steps}
      formId={props.formId}
      formQuery={formQuery}
      onSubmit={onSubmit}
      initialValues={formState}
      validationSchema={null}
      initialStep={props?.initialStep}
    />
  );
}

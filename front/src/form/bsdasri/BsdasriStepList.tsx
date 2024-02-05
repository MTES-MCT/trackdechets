import { useMutation, useQuery } from "@apollo/client";
import toast from "react-hot-toast";
import omitDeep from "omit-deep-lodash";
import React, { lazy, ReactElement, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Loader } from "../../Apps/common/Components";
import { getComputedState } from "../common/getComputedState";

import { IStepContainerProps } from "../common/stepper/Step";
import { toastApolloError } from "../common/stepper/toaster";
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
  BsdasriType
} from "@td/codegen-ui";
import getInitialState from "./utils/initial-state";
import {
  CREATE_DRAFT_BSDASRI,
  CREATE_BSDASRI,
  GET_BSDASRI,
  UPDATE_BSDASRI
} from "../../Apps/common/queries/bsdasri/queries";
import { TOAST_DURATION } from "../../common/config";

const GenericStepList = lazy(() => import("../common/stepper/GenericStepList"));
interface Props {
  children: (dasriForm: Bsdasri | undefined) => ReactElement;
  formId?: string;
  initialStep?: number;
  bsdasriFormType?: string;
}

const wasteKey = "waste";
const ecoOrganismeKey = "ecoOrganisme";
const emittedByEcoOrganismeKey = "ecoOrganisme.emittedByEcoOrganisme";

const emitterKey = "emitter";
const transporterKey = "transporter";
const destinationKey = "destination";
const identificationKey = "identification";
const synthesizingKey = "synthesizing";
const groupingKey = "grouping";
const transporterCompanySiretKey = "transporter.company.siret";
const transporterCompanyOrgIdKey = "transporter.company.orgId";
const transporterCompanyVatNumberKey = "transporter.company.vatNumber";
const transporterTransportPackagingsKey = "transporter.transport.packagings";
const transporterTransportVolumeKey = "transporter.transport.volume";

const getCommonKeys = (bsdasriType: BsdasriType): string[] => {
  if (bsdasriType === BsdasriType.Synthesis) {
    return [
      groupingKey,
      transporterCompanySiretKey,
      transporterCompanyOrgIdKey,
      transporterCompanyVatNumberKey,
      transporterTransportPackagingsKey,
      transporterTransportVolumeKey,
      emittedByEcoOrganismeKey
    ];
  }
  if (bsdasriType === BsdasriType.Grouping) {
    return [synthesizingKey, emittedByEcoOrganismeKey];
  }
  if (bsdasriType === BsdasriType.Simple) {
    return [synthesizingKey, groupingKey, emittedByEcoOrganismeKey];
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
    SIGNED_BY_PRODUCER: [...commonKeys],
    SENT: [
      wasteKey,
      ecoOrganismeKey,
      emitterKey,
      transporterKey,
      synthesizingKey,
      groupingKey,
      ...commonKeys
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
      ...commonKeys
    ]
  };

  return omitDeep(input, mapping[status]);
};
export default function BsdasriStepsList(props: Props) {
  const navigate = useNavigate();

  const formQuery = useQuery<Pick<Query, "bsdasri">, QueryBsdasriArgs>(
    GET_BSDASRI,
    {
      variables: {
        id: props.formId!
      },
      skip: !props.formId,
      fetchPolicy: "network-only"
    }
  );

  const mapRegrouped = dasri => ({
    ...dasri,
    grouping: dasri?.grouping.map(d => d.id),
    synthesizing: dasri?.synthesizing?.map(d => d.id)
  });

  const formState = useMemo(
    () =>
      getComputedState(
        getInitialState(),
        mapRegrouped(formQuery.data?.bsdasri)
      ),
    [formQuery.data]
  );

  const status = formState.id
    ? formQuery?.data?.bsdasri?.["bsdasriStatus"]
    : "INITIAL";

  const [createDraftBsdasri, { loading: creatingDraft }] = useMutation<
    Pick<Mutation, "createDraftBsdasri">,
    MutationCreateDraftBsdasriArgs
  >(CREATE_DRAFT_BSDASRI);

  const [createBsdasri, { loading: creating }] = useMutation<
    Pick<Mutation, "createBsdasri">,
    MutationCreateBsdasriArgs
  >(CREATE_BSDASRI);

  const [updateBsdasri, { loading: updating }] = useMutation<
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
            input: removeSections(cleanedInput, status, type)
          }
        });
      }
      return updateBsdasri({
        variables: {
          id: formState.id,
          input: removeSections(input, status, type)
        }
      });
    }

    if (type === BsdasriType.Synthesis) {
      const cleanedInput = omitDeep(input, [
        groupingKey,
        emitterKey,
        ecoOrganismeKey,
        transporterTransportPackagingsKey
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
        toast.error("Vous devez sélectionner des bordereaux à grouper", {
          duration: TOAST_DURATION
        });
        return;
      }
    }

    saveForm(input, type)
      .then(_ => {
        navigate(-1);
      })
      .catch(err => toastApolloError(err));
  }

  // As it's a render function, the steps are nested into a `<></>` block
  // So we render then unwrap to get the steps

  const parentOfSteps = props.children(formQuery.data?.bsdasri);
  const steps = parentOfSteps.props
    .children as ReactElement<IStepContainerProps>[];

  if ([BsdasriStatus.Processed, BsdasriStatus.Refused].includes(status)) {
    return <p>Ce bordereau n'est plus modifiable</p>;
  }
  return (
    <>
      <GenericStepList
        children={steps}
        formId={props.formId}
        formQuery={formQuery}
        onSubmit={onSubmit}
        initialValues={formState}
        validationSchema={null}
        initialStep={props?.initialStep}
      />
      {(creating || updating || creatingDraft) && <Loader />}
    </>
  );
}

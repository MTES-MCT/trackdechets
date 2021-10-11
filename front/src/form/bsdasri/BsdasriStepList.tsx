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
  MutationUpdateBsdasriArgs,
  QueryBsdasriArgs,
  Query,
  Bsdasri,
  BsdasriCreateInput,
  BsdasriStatus,
} from "generated/graphql/types";
import omit from "object.omit";
import React, { ReactElement, useMemo } from "react";
import { generatePath, useHistory, useParams } from "react-router-dom";
import getInitialState from "./utils/initial-state";
import { CREATE_BSDASRI, GET_BSDASRI, UPDATE_BSDASRI } from "./utils/queries";

interface Props {
  children: (dasriForm: Bsdasri | undefined) => ReactElement;
  formId?: string;
  initialStep?: number;
  bsdasriFormType?: string;
}
/**
 * Do not resend sections locked by relevant signatures
 */
const removeSignedSections = (
  input: BsdasriCreateInput,
  status: BsdasriStatus
) => {
  const emitterKey = "emitter";

  const transporterKey = "transporter";
  const destinationKey = "destination";

  const mapping = {
    INITIAL: [],
    SIGNED_BY_PRODUCER: [emitterKey],
    SENT: [emitterKey, transporterKey],
    RECEIVED: [emitterKey, transporterKey, destinationKey],
  };
  return omit(input, mapping[status]);
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
    if (!dasri?.transporter?.transport?.packagingInfos?.length) {
      dasri.transporter.transport.packagingInfos =
        dasri?.emitter?.emission?.packagingInfos;
    }

    if (!dasri?.destination?.reception?.packagingInfos?.length) {
      dasri.destination.reception.packagingInfos =
        dasri?.transporter?.transport?.packagingInfos;
    }
    return dasri;
  };
  const mapRegrouped = dasri => ({
    ...dasri,
    grouping: dasri?.grouping.map(r => ({
      id: r,
    })),
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

  const [createBsdasri] = useMutation<
    Pick<Mutation, "createBsdasri">,
    MutationCreateBsdasriArgs
  >(CREATE_BSDASRI);

  const [updateBsdasri] = useMutation<
    Pick<Mutation, "updateBsdasri">,
    MutationUpdateBsdasriArgs
  >(UPDATE_BSDASRI);

  function saveForm(input: BsdasriCreateInput): Promise<any> {
    return formState.id
      ? updateBsdasri({
          variables: {
            id: formState.id,
            input: removeSignedSections(input, status),
          },
        })
      : createBsdasri({ variables: { input: input } });
  }

  function onSubmit(e, values) {
    e.preventDefault();
    // As we want to be able to save draft, we skip validation on submit
    // and don't use the classic Formik mechanism

    if (
      props.bsdasriFormType === "bsdasriRegroup" ||
      formQuery.data?.bsdasri?.type === "GROUPING"
    ) {
      if (!values?.grouping?.length) {
        cogoToast.error("Vous devez sélectionner des bordereaux à regrouper", {
          hideAfter: 7,
        });
        return;
      }
    }
    const { id, ...input } = values;
    saveForm(input)
      .then(_ => {
        // TODO  redirect to the correct dashboard
        const redirectTo = generatePath(routes.dashboard.bsds.drafts, {
          siret,
        });
        history.push(redirectTo);
      })
      .catch(err => {
        err.graphQLErrors.map(err =>
          cogoToast.error(err.message, { hideAfter: 7 })
        );
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

import { gql, useMutation, useQuery } from "@apollo/client";
import {
  Mutation,
  Query,
  RegistryImportType,
  RegistryLineReason,
  SsdLineInput
} from "@td/codegen-ui";
import React from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "react-router-dom";

import Loader from "../../../Apps/common/Components/Loader/Loaders";
import { GET_REGISTRY_LOOKUPS } from "../../../dashboard/registry/shared";
import { FormBuilder } from "../builder/FormBuilder";
import { handleMutationResponse } from "../builder/handler";
import { isoDateToHtmlDate } from "../builder/utils";
import { GET_SSD_REGISTRY_LOOKUP } from "./query";
import { ssdFormShape } from "./shape";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormShape, FormShapeField } from "../builder/types";

type Props = { onClose: () => void };

const ADD_TO_SSD_REGISTRY = gql`
  mutation AddToSsdRegistry($lines: [SsdLineInput!]!) {
    addToSsdRegistry(lines: $lines) {
      stats {
        errors
        skipped
        insertions
        edits
        cancellations
      }
      errors {
        issues {
          path
          message
        }
      }
    }
  }
`;

const getFieldValidations = (
  field: FormShapeField
): Record<string, z.ZodType> => {
  switch (field.shape) {
    case "generic":
    case "custom":
      return field.validation;
    case "layout":
      return field.fields.reduce(
        (acc, childField) => ({ ...acc, ...getFieldValidations(childField) }),
        {}
      );
    default:
      return {};
  }
};

const schemaFromShape = (shape: FormShape) => {
  const validations = shape.reduce(
    (acc, tab) => {
      const tabValidations = tab.fields.reduce(
        (fieldAcc, field) => ({ ...fieldAcc, ...getFieldValidations(field) }),
        {}
      );
      return { ...acc, ...tabValidations };
    },
    {
      reason: z.enum([RegistryLineReason.Edit]).nullish()
    }
  );

  return z.object(validations);
};

export function RegistrySsdForm({ onClose }: Props) {
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);

  const methods = useForm<SsdLineInput>({
    defaultValues: {
      reason: queryParams.get("publicId") ? RegistryLineReason.Edit : undefined,
      secondaryWasteCodes: [],
      secondaryWasteDescriptions: []
    },
    resolver: async (data, context, options) => {
      console.log(data);
      const res = await zodResolver(schemaFromShape(ssdFormShape))(
        data,
        context,
        options
      );
      console.log(res);
      return res;
    }
  });

  const { loading: loadingLookup } = useQuery<Pick<Query, "registryLookup">>(
    GET_SSD_REGISTRY_LOOKUP,
    {
      variables: {
        type: RegistryImportType.Ssd,
        publicId: queryParams.get("publicId"),
        siret: queryParams.get("siret")
      },
      skip: !queryParams.get("publicId") || !queryParams.get("siret"),
      fetchPolicy: "network-only",
      onCompleted: data => {
        if (data.registryLookup.ssd) {
          const definedSsdProps = Object.fromEntries(
            Object.entries(data.registryLookup.ssd).filter(
              ([_, v]) => v != null
            )
          );

          methods.reset({
            ...definedSsdProps,
            processingDate: isoDateToHtmlDate(definedSsdProps.processingDate),
            dispatchDate: isoDateToHtmlDate(definedSsdProps.dispatchDate),
            useDate: isoDateToHtmlDate(definedSsdProps.useDate),
            reason: RegistryLineReason.Edit
          });
        }
      }
    }
  );

  const [addToSsdRegistry, { loading }] = useMutation<
    Pick<Mutation, "addToSsdRegistry">
  >(ADD_TO_SSD_REGISTRY, { refetchQueries: [GET_REGISTRY_LOOKUPS] });

  async function onSubmit(data: any) {
    const result = await addToSsdRegistry({
      variables: {
        lines: [
          {
            ...data,
            reason: data.reason || null,
            wasteCodeBale: data.wasteCodeBale || null,
            product: data.product || null,
            dispatchDate: data.dispatchDate || null,
            useDate: data.useDate || null,
            secondaryWasteCodes: data.secondaryWasteCodes?.filter(Boolean),
            secondaryWasteDescriptions:
              data.secondaryWasteDescriptions?.filter(Boolean),
            weightValue: data.weightValue ? parseFloat(data.weightValue) : null,
            volume: data.volume ? parseFloat(data.volume) : null,
            weightIsEstimate: data.weightIsEstimate === "true",
            processingEndDate: data.processingEndDate || null
          }
        ]
      }
    });

    const shouldCloseModal = handleMutationResponse(
      result.data?.addToSsdRegistry,
      methods
    );

    if (shouldCloseModal) {
      onClose();
    }
  }

  return loadingLookup ? (
    <Loader />
  ) : (
    <FormBuilder
      methods={methods}
      shape={ssdFormShape}
      onSubmit={onSubmit}
      loading={loading}
    />
  );
}

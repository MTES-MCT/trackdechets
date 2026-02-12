import { ApolloError, useMutation, useQuery } from "@apollo/client";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  IncomingTexsLineInput,
  Mutation,
  Query,
  RegistryImportType,
  RegistryLineReason,
} from "@td/codegen-ui";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "react-router-dom";
import Loader from "../../../Apps/common/Components/Loader/Loaders";
import { GET_REGISTRY_LOOKUPS } from "../../../dashboard/registry/shared";
import { FormBuilder } from "../builder/FormBuilder";
import { handleMutationResponse } from "../builder/handler";
import { FormTransporter } from "../builder/types";
import { filterFilledTransporters, INITIAL_TRANSPORTER } from "../common/TransporterSelector/TransporterSelector";
import {
  handleServerError,
  isoDateToHtmlDate,
  schemaFromShape,
  transformToFieldArrayObjects
} from "../builder/utils";
import {
  ADD_TO_INCOMING_TEXS_REGISTRY,
  GET_INCOMING_TEXS_REGISTRY_LOOKUP
} from "../queries";
import { incomingTexsFormShape } from "./shape";

type Props = { onClose: () => void };

type FormValues = Omit<
  IncomingTexsLineInput,
  | "parcelInseeCodes"
  | "parcelNumbers"
  | "parcelCoordinates"
  | "destinationParcelInseeCodes"
  | "destinationParcelNumbers"
  | "destinationParcelCoordinates"
> & {
  transporter: FormTransporter[];
  parcelInseeCodes: { value: string }[];
  parcelNumbers: { value: string }[];
  parcelCoordinates: { value: string }[];
  destinationParcelInseeCodes: { value: string }[];
  destinationParcelNumbers: { value: string }[];
  destinationParcelCoordinates: { value: string }[];
};

const DEFAULT_VALUES: Partial<FormValues> = {
  wastePop: false,
  weightIsEstimate: true,
  wasteIsDangerous: false,
  noTraceability: false,
  isUpcycled: false,
  isDirectSupply: false,
  parcelInseeCodes: [],
  parcelNumbers: [],
  parcelCoordinates: [],
  destinationParcelInseeCodes: [],
  destinationParcelNumbers: [],
  destinationParcelCoordinates: [],
  initialEmitterMunicipalitiesInseeCodes: [],
  transporter: [
    {
      ...INITIAL_TRANSPORTER,
    }
  ]
};

const getInitialDisabledFields = (values: {
  isUpcycled?: boolean | null;
  isDirectSupply?: boolean | null;
  wasteCode?: string | null;
  operationCode?: string | null;
}): string[] => {
  const disabled: string[] = [];

  // If isUpcycled is false or null, disable destinationParcelInseeCodes
  if (!values.isUpcycled) {
    disabled.push("destinationParcelInseeCodes");
  }

  // If isDirectSupply is true, disable transporter
  if (values.isDirectSupply) {
    disabled.push("transporter");
  }

  // If wasteCode contains "*", disable wasteIsDangerous
  if (values.wasteCode && values.wasteCode.includes("*")) {
    disabled.push("wasteIsDangerous");
  }

  // If operationCode starts with "D", disable isUpcycled
  if (values.operationCode && values.operationCode.startsWith("D")) {
    disabled.push("isUpcycled");
  }

  return disabled;
};

export function RegistryIncomingTexsForm({ onClose }: Props) {
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const isDuplicate = queryParams.get("duplicate") === "1";
  const hasPublicId = !!queryParams.get("publicId");
  const hasSiret = !!queryParams.get("siret");
  const [disabledFieldNames, setDisabledFieldNames] = useState<string[]>(
    getInitialDisabledFields(DEFAULT_VALUES)
  );
  const [loadingLookup, setLoadingLookup] = useState(hasPublicId && hasSiret);

  const methods = useForm<FormValues>({
    defaultValues: {
      ...DEFAULT_VALUES,
      reason: hasPublicId && !isDuplicate ? RegistryLineReason.Edit : undefined
    },
    resolver: zodResolver(schemaFromShape(incomingTexsFormShape))
  });

  useQuery<Pick<Query, "registryLookup">>(GET_INCOMING_TEXS_REGISTRY_LOOKUP, {
    variables: {
      type: RegistryImportType.IncomingTexs,
      publicId: queryParams.get("publicId"),
      siret: queryParams.get("siret")
    },
    skip: !hasPublicId || !hasSiret,
    fetchPolicy: "network-only",
    onCompleted: data => {
      if (data?.registryLookup?.incomingTexs) {
        const transportersObj: Record<string, Partial<FormTransporter>> = {};
        const definedIncominTexsProps = Object.fromEntries(
          Object.entries(data.registryLookup.incomingTexs).filter(
            ([key, value]) => {
              if (key.startsWith("transporter")) {
                const [_, transporterNum, field] =
                  key.match(/transporter(\d)(.*)/) || [];
                if (transporterNum && field) {
                  const transporterKey = `transporter${transporterNum}`;
                  if (!transportersObj[transporterKey]) {
                    transportersObj[transporterKey] = {};
                  }
                  transportersObj[transporterKey][field] = value;
                  return false; // Don't include these fields in the main object
                }
              }
              return value != null;
            }
          )
        ) as IncomingTexsLineInput;

        const transporters = Object.values(transportersObj).filter(
          partialTransporter => {
            if (
              partialTransporter.TransportMode ||
              partialTransporter.CompanyType
            ) {
              return true;
            }
            return false;
          }
        );
        // For duplication, exclude publicId from the form data
        const { publicId: _, ...propsWithoutPublicId } =
          definedIncominTexsProps;

        // Set the form values with the transformed data
        const resetValues = {
          ...DEFAULT_VALUES,
          ...(isDuplicate ? propsWithoutPublicId : definedIncominTexsProps),
          receptionDate: isoDateToHtmlDate(
            definedIncominTexsProps.receptionDate
          ),
          parcelInseeCodes: transformToFieldArrayObjects(
            definedIncominTexsProps.parcelInseeCodes
          ),
          parcelNumbers: transformToFieldArrayObjects(
            definedIncominTexsProps.parcelNumbers
          ),
          parcelCoordinates: transformToFieldArrayObjects(
            definedIncominTexsProps.parcelCoordinates
          ),
          destinationParcelInseeCodes: transformToFieldArrayObjects(
            definedIncominTexsProps.destinationParcelInseeCodes
          ),
          destinationParcelNumbers: transformToFieldArrayObjects(
            definedIncominTexsProps.destinationParcelNumbers
          ),
          destinationParcelCoordinates: transformToFieldArrayObjects(
            definedIncominTexsProps.destinationParcelCoordinates
          ),
          reason: isDuplicate ? undefined : RegistryLineReason.Edit,
          transporter: transporters,
          texsAnalysisFileId:
            data.registryLookup.incomingTexs.texsAnalysisFiles?.[0]?.id || null
        };

        methods.reset(resetValues);

        const initialDisabled = getInitialDisabledFields(resetValues);
        // For duplication, don't disable any fields
        setDisabledFieldNames(
          isDuplicate
            ? initialDisabled
            : [...initialDisabled, "publicId", "reportForCompanySiret"]
        );
      }
      setLoadingLookup(false);
    },
    onError: error => {
      setLoadingLookup(false);
      handleServerError(methods, error);
    }
  });

  const isUpcycled = methods.watch("isUpcycled");
  useEffect(() => {
    if (isUpcycled) {
      setDisabledFieldNames(prev =>
        prev.filter(field => field !== "destinationParcelInseeCodes")
      );
    } else {
      setDisabledFieldNames(prev => [...prev, "destinationParcelInseeCodes"]);
      // the ParcelsVisualizer handles the cleanup of destinationParcel infos
      // add this if the switch or ParcelsVisualizer are moved to different tabs at some point
      // methods.setValue("destinationParcelInseeCodes", []);
      // methods.setValue("destinationParcelNumbers", []);
      // methods.setValue("destinationParcelCoordinates", []);
    }
  }, [isUpcycled, methods]);

  const isDirectSupply = methods.watch("isDirectSupply");
  useEffect(() => {
    if (isDirectSupply) {
      setDisabledFieldNames(prev => [...prev, "transporter"]);
      methods.setValue("transporter", []);
    } else {
      setDisabledFieldNames(prev =>
        prev.filter(field => field !== "transporter")
      );
    }
  }, [isDirectSupply, methods]);

  const wasteCode = methods.watch("wasteCode");
  useEffect(() => {
    if (wasteCode && wasteCode.includes("*")) {
      setDisabledFieldNames(prev => [...prev, "wasteIsDangerous"]);
      methods.setValue("wasteIsDangerous", true);
    } else {
      setDisabledFieldNames(prev =>
        prev.filter(field => field !== "wasteIsDangerous")
      );
    }
  }, [wasteCode, methods]);

  const operationCode = methods.watch("operationCode");
  useEffect(() => {
    if (operationCode && operationCode.startsWith("D")) {
      setDisabledFieldNames(prev => [...prev, "isUpcycled"]);
      methods.setValue("isUpcycled", false);
    } else {
      setDisabledFieldNames(prev =>
        prev.filter(field => field !== "isUpcycled")
      );
    }
  }, [operationCode, methods]);

  const [addToIncomingTexsRegistry, { loading }] = useMutation<
    Pick<Mutation, "addToIncomingTexsRegistry">
  >(ADD_TO_INCOMING_TEXS_REGISTRY, { refetchQueries: [GET_REGISTRY_LOOKUPS] });

  async function onSubmit(data: FormValues) {
    const { transporter, ...rest } = data;
    const transportersToSubmit = filterFilledTransporters(transporter);
    // Flatten transporter array back into individual fields
    const flattenedData = {
      ...rest,
      ...transportersToSubmit.reduce(
        (acc, t, index) => ({
          ...acc,
          [`transporter${index + 1}TransportMode`]: t.TransportMode,
          [`transporter${index + 1}CompanyType`]: t.CompanyType,
          [`transporter${index + 1}CompanyOrgId`]: t.CompanyOrgId,
          [`transporter${index + 1}RecepisseIsExempted`]: t.RecepisseIsExempted,
          [`transporter${index + 1}RecepisseNumber`]: t.RecepisseNumber,
          [`transporter${index + 1}CompanyName`]: t.CompanyName,
          [`transporter${index + 1}CompanyAddress`]: t.CompanyAddress,
          [`transporter${index + 1}CompanyPostalCode`]: t.CompanyPostalCode,
          [`transporter${index + 1}CompanyCity`]: t.CompanyCity,
          [`transporter${index + 1}CompanyCountryCode`]: t.CompanyCountryCode
        }),
        {}
      )
    };
    try {
      const result = await addToIncomingTexsRegistry({
        variables: {
          lines: [flattenedData]
        }
      });

      const shouldCloseModal = handleMutationResponse(
        result.data?.addToIncomingTexsRegistry,
        methods
      );

      if (shouldCloseModal) {
        onClose();
      }
    } catch (error) {
      handleServerError(methods, error as ApolloError | Error);
    }
  }

  return loadingLookup ? (
    <Loader />
  ) : (
    <FormBuilder
      registryType={RegistryImportType.IncomingTexs}
      methods={methods}
      shape={incomingTexsFormShape}
      onSubmit={onSubmit}
      loading={loading}
      disabledFieldNames={disabledFieldNames}
    />
  );
}

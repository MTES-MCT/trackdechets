import React from "react";
import CompanyFormWrapper from "../common/Components/CompanyFormWrapper";
import { useForm, useFieldArray } from "react-hook-form";
import {
  BrokerReceipt,
  CompanyPrivate,
  CompanyType,
  TraderReceipt,
  TransporterReceipt,
  UserRole,
  VhuAgrement,
  WorkerCertification
} from "@td/codegen-ui";
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { COMPANY_CONSTANTS, formatDate } from "../common/utils";
import TdTooltip from "../../../common/components/Tooltip";
import {
  CREATE_BROKER_RECEIPT_,
  CREATE_TRADER_RECEIPT_,
  CREATE_TRANSPORTER_RECEIPT_,
  CREATE_VHU_AGREMENT_,
  CREATE_WORKER_CERTIFICATION,
  DELETE_BROKER_RECEIPT,
  DELETE_TRADER_RECEIPT,
  DELETE_TRANSPORTER_RECEIPT,
  DELETE_VHU_AGREMENT,
  DELETE_WORKER_CERTIFICATION,
  UPDATE_BROKER_RECEIPT,
  UPDATE_COMPANY_BROKER_RECEIPT,
  UPDATE_COMPANY_TRADER_RECEIPT,
  UPDATE_COMPANY_TRANSPORTER_RECEIPT,
  UPDATE_COMPANY_TYPES,
  UPDATE_COMPANY_VHU_AGREMENT,
  UPDATE_COMPANY_VHU_AGREMENT_DEMOLISSEUR,
  UPDATE_COMPANY_WORKER_CERTIFICATION,
  UPDATE_TRADER_RECEIPT,
  UPDATE_TRANSPORTER_RECEIPT,
  UPDATE_VHU_AGREMENT,
  UPDATE_WORKER_CERTIFICATION
} from "../common/queries";
import { gql, useMutation } from "@apollo/client";
import { Loader } from "../../common/Components";
import CompanyProfileSubForm from "./CompanyProfileSubForm";
import { NotificationError } from "../../common/Components/Error/Error";
import CompanyProfileInformation from "./CompanyProfileInformation";

interface CompanyProfileFormProps {
  company: CompanyPrivate;
}
interface CompanyProfileFormFields {
  companyTypes: {
    label: string | undefined;
    value: CompanyType | undefined;
    helpText?: string;
    isChecked: boolean;
  }[];
  workerCertification?: WorkerCertification;
  transporterReceipt?: TransporterReceipt;
  brokerReceipt?: BrokerReceipt;
  traderReceipt?: TraderReceipt;
  vhuAgrementBroyeur?: VhuAgrement;
  vhuAgrementDemolisseur?: VhuAgrement;
}

const CompanyProfileForm = ({ company }: CompanyProfileFormProps) => {
  const [
    updateCompanyTypes,
    {
      data: dataUpdateCompanyType,
      loading: LoadingCompanyTypes,
      error: errorCompanyTypes
    }
  ] = useMutation(UPDATE_COMPANY_TYPES);

  const getFormattedComapnyTypes = companyTypes => {
    const companyTypesFormatted = companyTypes?.map(companyType => {
      const companyTypeObj = COMPANY_CONSTANTS.find(
        constant => constant.value === companyType
      );
      return {
        label: companyTypeObj?.label,
        isChecked: true,
        value: companyTypeObj?.value,
        helpText: companyTypeObj?.helpText
      };
    });

    const companyTypesAllValues = COMPANY_CONSTANTS.map(companyType => {
      const companyTypeInitial = companyTypesFormatted?.find(
        c => c.value === companyType.value
      );
      if (companyTypeInitial) {
        return companyTypeInitial;
      }
      return { ...companyType, isChecked: false };
    });

    return companyTypesAllValues;
  };
  const companyTypesFormatted = getFormattedComapnyTypes(company.companyTypes);

  const defaultValues: CompanyProfileFormFields = {
    companyTypes: companyTypesFormatted || [],
    vhuAgrementBroyeur: company.vhuAgrementBroyeur as VhuAgrement,
    vhuAgrementDemolisseur: company.vhuAgrementDemolisseur as VhuAgrement,
    transporterReceipt: {
      ...company.transporterReceipt,
      validityLimit: formatDate(company.transporterReceipt?.validityLimit)
    } as TransporterReceipt,
    brokerReceipt: {
      ...company.brokerReceipt,
      validityLimit: formatDate(company.brokerReceipt?.validityLimit)
    } as BrokerReceipt,
    traderReceipt: {
      ...company.traderReceipt,
      validityLimit: formatDate(company.traderReceipt?.validityLimit)
    } as TraderReceipt,
    workerCertification: {
      ...company.workerCertification,
      validityLimit: formatDate(company.workerCertification?.validityLimit)
    } as WorkerCertification
  };

  const { handleSubmit, reset, formState, register, control, watch } =
    useForm<CompanyProfileFormFields>({
      defaultValues,
      values: dataUpdateCompanyType?.updateCompany && {
        ...defaultValues,
        ...dataUpdateCompanyType?.updateCompany,
        companyTypes: getFormattedComapnyTypes(
          dataUpdateCompanyType?.updateCompany?.companyTypes
        )
      }
    });

  const { fields } = useFieldArray<CompanyProfileFormFields>({
    control, // control props comes from useForm (optional: if you are using FormProvider)
    name: "companyTypes"
  });
  const [
    createOrUpdateTransporterReceipt,
    { loading: LoadingTransportReceipt, error: errorTransportReceipt }
  ] = useMutation(
    company.transporterReceipt
      ? UPDATE_TRANSPORTER_RECEIPT
      : CREATE_TRANSPORTER_RECEIPT_
  );

  const [
    updateCompanyTransporterReceipt,
    {
      loading: LoadingUpdateCompanyTransportReceipt,
      error: errorUpdateCompanyTransportReceipt
    }
  ] = useMutation(UPDATE_COMPANY_TRANSPORTER_RECEIPT);
  const [deleteTransporterReceipt] = useMutation(DELETE_TRANSPORTER_RECEIPT, {
    update(cache) {
      cache.writeFragment({
        id: `CompanyPrivate:${company.id}`,
        fragment: gql`
          fragment TransporterReceiptCompanyFragment on CompanyPrivate {
            id
            transporterReceipt {
              id
            }
          }
        `,
        data: { transporterReceipt: null }
      });
    }
  });
  const [
    createOrUpdateVhuAgrementBroyeur,
    { loading: LoadingVhuBroyeur, error: errorVhuBroyeur }
  ] = useMutation(
    company.vhuAgrementBroyeur ? UPDATE_VHU_AGREMENT : CREATE_VHU_AGREMENT_
  );
  const [
    createOrUpdateVhuAgrementDemolisseur,
    { loading: LoadingVhuDemolisseur, error: errorVhuDemolisseur }
  ] = useMutation(
    company.vhuAgrementDemolisseur ? UPDATE_VHU_AGREMENT : CREATE_VHU_AGREMENT_
  );

  const [
    updateCompanyVhuAgrementBroyeur,
    {
      loading: loadingUpdateCompanyVhuBroyeur,
      error: errorUpdateCompanyVhuBroyeur
    }
  ] = useMutation(UPDATE_COMPANY_VHU_AGREMENT);

  const [
    deleteVhuAgrementBroyeur,
    { loading: loadingDeleteVhuBroyeur, error: errorDeleteVhuBroyeur }
  ] = useMutation(DELETE_VHU_AGREMENT, {
    update(cache) {
      cache.writeFragment({
        id: `CompanyPrivate:${company.id}`,
        fragment: gql`
          fragment VhuAgrementBroyeurCompanyFragment on CompanyPrivate {
            id
            vhuAgrementBroyeur {
              id
            }
          }
        `,
        data: { vhuAgrementBroyeur: null }
      });
    }
  });

  const [
    updateCompanyVhuAgrementDemolisseur,
    {
      loading: loadingUpdateCompanyVhuDemolisseur,
      error: errorUpdateCompanyVhuDemolisseur
    }
  ] = useMutation(UPDATE_COMPANY_VHU_AGREMENT_DEMOLISSEUR);

  const [
    deleteVhuAgrementDemolisseur,
    { loading: loadingDeleteVhuDemolisseur, error: errorDeleteVhuDemolisseur }
  ] = useMutation(DELETE_VHU_AGREMENT, {
    update(cache) {
      cache.writeFragment({
        id: `CompanyPrivate:${company.id}`,
        fragment: gql`
          fragment VhuAgrementDemolisseurCompanyFragment on CompanyPrivate {
            id
            vhuAgrementDemolisseur {
              id
            }
          }
        `,
        data: { vhuAgrementDemolisseur: null }
      });
    }
  });

  const [
    createOrUpdateTraderReceipt,
    {
      loading: updateOrCreateLoadingTraderReceipt,
      error: updateOrCreateErrorTraderReceipt
    }
  ] = useMutation(
    company.traderReceipt ? UPDATE_TRADER_RECEIPT : CREATE_TRADER_RECEIPT_
  );

  const [
    updateCompanyTraderReceipt,
    {
      loading: updateCompanyLoadingTraderReceipt,
      error: updateCompanyErrorTraderReceipt
    }
  ] = useMutation(UPDATE_COMPANY_TRADER_RECEIPT);

  const [
    deleteTraderReceipt,
    { loading: deleteLoadingTraderReceipt, error: deleteErrorTraderReceipt }
  ] = useMutation(DELETE_TRADER_RECEIPT, {
    update(cache) {
      cache.writeFragment({
        id: `CompanyPrivate:${company.id}`,
        fragment: gql`
          fragment TraderReceiptCompanyFragment on CompanyPrivate {
            id
            traderReceipt {
              id
            }
          }
        `,
        data: { traderReceipt: null }
      });
    }
  });

  const [
    createOrUpdateBrokerReceipt,
    {
      loading: updateOrCreateLoadingBrokerReceipt,
      error: updateOrCreateErrorBrokerReceipt
    }
  ] = useMutation(
    company.brokerReceipt ? UPDATE_BROKER_RECEIPT : CREATE_BROKER_RECEIPT_
  );

  const [
    updateCompanyBrokerReceipt,
    {
      loading: updateCompanyLoadingBrokerReceipt,
      error: updateCompanyErrorBrokerReceipt
    }
  ] = useMutation(UPDATE_COMPANY_BROKER_RECEIPT);

  const [
    deleteBrokerReceipt,
    { loading: deleteLoadingBrokerReceipt, error: deleteErrorBrokerReceipt }
  ] = useMutation(DELETE_BROKER_RECEIPT, {
    update(cache) {
      cache.writeFragment({
        id: `CompanyPrivate:${company.id}`,
        fragment: gql`
          fragment BrokerReceiptCompanyFragment on CompanyPrivate {
            brokerReceipt {
              id
            }
          }
        `,
        data: { brokerReceipt: null }
      });
    }
  });

  const [
    createOrUpdateWorkerCertification,
    {
      loading: updateOrCreateLoadingWorkerCertif,
      error: updateOrCreateErrorWorkerCertif
    }
  ] = useMutation(
    company.workerCertification
      ? UPDATE_WORKER_CERTIFICATION
      : CREATE_WORKER_CERTIFICATION
  );

  const [
    updateCompanyWorkerCertification,
    {
      loading: updateCompanyWorkerCertifLoading,
      error: updateCompanyWorkerCertifError
    }
  ] = useMutation(UPDATE_COMPANY_WORKER_CERTIFICATION);

  const [
    deleteWorkerCertification,
    { loading: deleteLoadingWorkerCertif, error: deleteErrorWorkerCertif }
  ] = useMutation(DELETE_WORKER_CERTIFICATION, {
    update(cache) {
      cache.writeFragment({
        id: `CompanyPrivate:${company.id}`,
        fragment: gql`
          fragment WorkerCertificationCompanyFragment on CompanyPrivate {
            id
            workerCertification {
              id
            }
          }
        `,
        data: { workerCertification: null }
      });
    }
  });

  const handleCreateOrUpdateBrokerReceipt = async dataToUpdate => {
    const input = {
      ...(company.brokerReceipt?.id ? { id: company.brokerReceipt.id } : {}),
      receiptNumber: dataToUpdate.brokerReceipt.receiptNumber,
      validityLimit: dataToUpdate.brokerReceipt.validityLimit,
      department: dataToUpdate.brokerReceipt.department
    };
    const { data } = await createOrUpdateBrokerReceipt({
      variables: { input }
    });
    if (data.createBrokerReceipt) {
      await updateCompanyBrokerReceipt({
        variables: {
          id: company.id,
          brokerReceiptId: data.createBrokerReceipt.id
        }
      });
    }
  };
  const handleCreateOrUpdateWorkerCertification = async dataToUpdate => {
    let input = {
      ...(company.workerCertification?.id
        ? { id: company.workerCertification.id }
        : {}),
      hasSubSectionFour: dataToUpdate.workerCertification.hasSubSectionFour,
      hasSubSectionThree: dataToUpdate.workerCertification.hasSubSectionThree
    };

    if (dataToUpdate.workerCertification.hasSubSectionThree) {
      input = {
        ...input,
        hasSubSectionThree: dataToUpdate.workerCertification.hasSubSectionThree,
        certificationNumber:
          dataToUpdate.workerCertification.certificationNumber,
        validityLimit: dataToUpdate.workerCertification.validityLimit ?? null,
        organisation: dataToUpdate.workerCertification.organisation
      } as WorkerCertification;
    }
    const { data } = await createOrUpdateWorkerCertification({
      variables: { input }
    });
    if (data.createWorkerCertification) {
      await updateCompanyWorkerCertification({
        variables: {
          id: company.id,
          workerCertificationId: data.createWorkerCertification.id
        }
      });
    }
  };
  const handleCreateOrUpdateTraderReceipt = async dataToUpdate => {
    const input = {
      ...(company.traderReceipt?.id ? { id: company.traderReceipt.id } : {}),
      receiptNumber: dataToUpdate.traderReceipt.receiptNumber,
      validityLimit: dataToUpdate.traderReceipt.validityLimit,
      department: dataToUpdate.traderReceipt.department
    };
    const { data } = await createOrUpdateTraderReceipt({
      variables: { input }
    });
    if (data.createTraderReceipt) {
      await updateCompanyTraderReceipt({
        variables: {
          id: company.id,
          traderReceiptId: data.createTraderReceipt.id
        }
      });
    }
  };

  const handleCreateOrUpdateTransporterReceipt = async dataToUpdate => {
    const input = {
      ...(company.transporterReceipt?.id
        ? { id: company.transporterReceipt.id }
        : {}),
      receiptNumber: dataToUpdate.transporterReceipt.receiptNumber,
      validityLimit: dataToUpdate.transporterReceipt.validityLimit,
      department: dataToUpdate.transporterReceipt.department
    };
    const { data } = await createOrUpdateTransporterReceipt({
      variables: { input }
    });
    if (data.createTransporterReceipt) {
      await updateCompanyTransporterReceipt({
        variables: {
          id: company.id,
          transporterReceiptId: data.createTransporterReceipt.id
        }
      });
    }
  };

  const handleCreateOrUpdateVhuAgrementBroyeur = async dataToUpdate => {
    const inputBroyeur = {
      ...(company.vhuAgrementBroyeur?.id
        ? { id: company.vhuAgrementBroyeur.id }
        : {}),

      agrementNumber: dataToUpdate.vhuAgrementBroyeur.agrementNumber,
      department: dataToUpdate.vhuAgrementBroyeur.department
    };
    const { data: dataBroyeur } = await createOrUpdateVhuAgrementBroyeur({
      variables: { input: inputBroyeur }
    });
    if (dataBroyeur.createVhuAgrement) {
      await updateCompanyVhuAgrementBroyeur({
        variables: {
          id: company.id,
          vhuAgrementBroyeurId: dataBroyeur.createVhuAgrement.id
        }
      });
    }
  };

  const handleCreateOrUpdateVhuAgrementDemolisseur = async dataToUpdate => {
    const inputDemolisseur = {
      ...(company.vhuAgrementDemolisseur?.id
        ? { id: company.vhuAgrementDemolisseur.id }
        : {}),

      agrementNumber: dataToUpdate.vhuAgrementDemolisseur.agrementNumber,
      department: dataToUpdate.vhuAgrementDemolisseur.department
    };
    const { data: dataDemolisseur } =
      await createOrUpdateVhuAgrementDemolisseur({
        variables: { input: inputDemolisseur }
      });
    if (dataDemolisseur.createVhuAgrement) {
      await updateCompanyVhuAgrementDemolisseur({
        variables: {
          id: company.id,
          vhuAgrementDemolisseurId: dataDemolisseur.createVhuAgrement.id
        }
      });
    }
  };

  const handleDeletes = async companyTypesToUpdate => {
    const shouldDeleteWorkerCertification =
      !companyTypesToUpdate.includes(CompanyType.Worker) &&
      company.workerCertification;
    const shouldDeleteTransporterReceipt =
      !companyTypesToUpdate.includes(CompanyType.Transporter) &&
      company.transporterReceipt;
    const shouldDeleteBrokerReceipt =
      !companyTypesToUpdate.includes(CompanyType.Broker) &&
      company.brokerReceipt;
    const shouldDeleteTraderReceipt =
      !companyTypesToUpdate.includes(CompanyType.Trader) &&
      company.traderReceipt;
    const shouldDeleteVhuAgrementBroyeur =
      !companyTypesToUpdate.includes(CompanyType.WasteVehicles) &&
      company.vhuAgrementBroyeur;
    const shouldDeleteVhuAgrementDemolisseur =
      !companyTypesToUpdate.includes(CompanyType.WasteVehicles) &&
      company.vhuAgrementDemolisseur;

    if (shouldDeleteWorkerCertification) {
      await deleteWorkerCertification({
        variables: {
          input: { id: company.workerCertification?.id }
        }
      });
    }
    if (shouldDeleteBrokerReceipt) {
      await deleteBrokerReceipt({
        variables: {
          input: { id: company.brokerReceipt?.id }
        }
      });
    }
    if (shouldDeleteTraderReceipt) {
      await deleteTraderReceipt({
        variables: {
          input: { id: company.traderReceipt?.id }
        }
      });
    }
    if (shouldDeleteTransporterReceipt) {
      await deleteTransporterReceipt({
        variables: {
          input: { id: company.transporterReceipt?.id }
        }
      });
    }
    if (shouldDeleteVhuAgrementBroyeur) {
      await deleteVhuAgrementBroyeur({
        variables: {
          input: { id: company.vhuAgrementBroyeur?.id }
        }
      });
    }
    if (shouldDeleteVhuAgrementDemolisseur) {
      await deleteVhuAgrementDemolisseur({
        variables: {
          input: { id: company.vhuAgrementDemolisseur?.id }
        }
      });
    }
  };

  const handleUpdates = async (data, companyTypesToUpdate) => {
    const shouldCreateOrUpdateWorkerCertification =
      companyTypesToUpdate.includes(CompanyType.Worker);
    const shouldCreateOrUpdateTransporterReceipt =
      companyTypesToUpdate.includes(CompanyType.Transporter) &&
      data.transporterReceipt.receiptNumber;
    const shouldCreateOrUpdateBrokerReceipt =
      companyTypesToUpdate.includes(CompanyType.Broker) &&
      data.brokerReceipt.receiptNumber;
    const shouldCreateOrUpdateTraderReceipt =
      companyTypesToUpdate.includes(CompanyType.Trader) &&
      data.traderReceipt.receiptNumber;
    const shouldCreateOrUpdateVhuAgrementBroyeur =
      companyTypesToUpdate.includes(CompanyType.WasteVehicles) &&
      data.vhuAgrementBroyeur.agrementNumber;
    const shouldCreateOrUpdateVhuAgrementDemolisseur =
      companyTypesToUpdate.includes(CompanyType.WasteVehicles) &&
      data.vhuAgrementDemolisseur.agrementNumber;

    if (shouldCreateOrUpdateWorkerCertification) {
      await handleCreateOrUpdateWorkerCertification(data);
    }
    if (shouldCreateOrUpdateBrokerReceipt) {
      await handleCreateOrUpdateBrokerReceipt(data);
    }
    if (shouldCreateOrUpdateTraderReceipt) {
      await handleCreateOrUpdateTraderReceipt(data);
    }
    if (shouldCreateOrUpdateTransporterReceipt) {
      await handleCreateOrUpdateTransporterReceipt(data);
    }
    if (shouldCreateOrUpdateVhuAgrementBroyeur) {
      await handleCreateOrUpdateVhuAgrementBroyeur(data);
    }
    if (shouldCreateOrUpdateVhuAgrementDemolisseur) {
      await handleCreateOrUpdateVhuAgrementDemolisseur(data);
    }
  };

  const handleUpdateCompanyTypes = async data => {
    const companyTypesToUpdate = data.companyTypes
      .map(type => {
        if (type.isChecked) {
          return type.value;
        }
        return null;
      })
      .filter(f => f !== null);

    await updateCompanyTypes({
      variables: {
        id: company.id,
        companyTypes: companyTypesToUpdate
      }
    });

    //updates
    handleUpdates(data, companyTypesToUpdate);

    //deletes
    handleDeletes(companyTypesToUpdate);
  };

  const loading =
    LoadingCompanyTypes ||
    LoadingTransportReceipt ||
    LoadingUpdateCompanyTransportReceipt ||
    LoadingVhuBroyeur ||
    LoadingVhuDemolisseur ||
    loadingUpdateCompanyVhuBroyeur ||
    loadingDeleteVhuBroyeur ||
    loadingUpdateCompanyVhuDemolisseur ||
    loadingDeleteVhuDemolisseur ||
    updateOrCreateLoadingTraderReceipt ||
    updateCompanyLoadingTraderReceipt ||
    deleteLoadingTraderReceipt ||
    updateOrCreateLoadingBrokerReceipt ||
    updateCompanyLoadingBrokerReceipt ||
    deleteLoadingBrokerReceipt ||
    updateOrCreateLoadingWorkerCertif ||
    updateCompanyWorkerCertifLoading ||
    deleteLoadingWorkerCertif;
  const error =
    errorCompanyTypes ||
    errorTransportReceipt ||
    errorUpdateCompanyTransportReceipt ||
    errorVhuBroyeur ||
    errorVhuDemolisseur ||
    errorUpdateCompanyVhuBroyeur ||
    errorDeleteVhuBroyeur ||
    errorUpdateCompanyVhuDemolisseur ||
    errorDeleteVhuDemolisseur ||
    updateOrCreateErrorTraderReceipt ||
    updateCompanyErrorTraderReceipt ||
    deleteErrorTraderReceipt ||
    updateOrCreateErrorBrokerReceipt ||
    updateCompanyErrorBrokerReceipt ||
    deleteErrorBrokerReceipt ||
    updateOrCreateErrorWorkerCertif ||
    updateCompanyWorkerCertifError ||
    deleteErrorWorkerCertif;

  return (
    <CompanyFormWrapper
      title="Profil"
      reset={reset}
      disabled={!formState.isDirty || formState.isSubmitting}
      defaultValues={defaultValues}
      isAdmin={company.userRole === UserRole.Admin}
      dataTestId="company-profile-edit"
    >
      {(formRef, isEditing, onClose) =>
        isEditing ? (
          <form
            ref={formRef}
            onSubmit={handleSubmit(async data => {
              await handleUpdateCompanyTypes(data);
              if (!error) {
                onClose();
              }
            })}
          >
            {fields.map((field, index) => {
              return (
                <div key={field.id}>
                  <div className="fr-grid-row fr-grid-row--gutters">
                    <div className="fr-col-11">
                      <Checkbox
                        options={[
                          {
                            label: field.label,
                            nativeInputProps: {
                              ...register(`companyTypes.${index}.isChecked`)
                            }
                          }
                        ]}
                      />
                    </div>
                    <div className="fr-col-1">
                      <TdTooltip msg={field.helpText} />
                    </div>
                  </div>
                  <CompanyProfileSubForm
                    register={register}
                    field={field}
                    watch={watch}
                    formState={formState}
                  />
                </div>
              );
            })}
            {loading && <Loader />}
            {error && <NotificationError apolloError={error} />}
          </form>
        ) : (
          <CompanyProfileInformation
            company={company}
            companyTypesFormatted={companyTypesFormatted}
          />
        )
      }
    </CompanyFormWrapper>
  );
};
export default CompanyProfileForm;

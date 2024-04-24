import React from "react";
import { CompanyPrivate, UserRole } from "@td/codegen-ui";
import { useForm } from "react-hook-form";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { object, string, ObjectSchema } from "yup";
import { useMutation } from "@apollo/client";
import { yupResolver } from "@hookform/resolvers/yup";
import { UPDATE_CONTACT_INFOS } from "../common/queries";
import { NotificationError } from "../../common/Components/Error/Error";
import { validatePhoneNumber } from "../../../common/helper";
import CompanyFormWrapper from "../common/Components/CompanyFormWrapper";
import { Loader } from "../../common/Components";

interface ContactFormProps {
  company: CompanyPrivate;
}
interface ContactFormFields {
  contact: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
}
// replace with zod schema
const yupSchema = object()
  .shape({
    contact: string().required(),
    contactEmail: string().email().required(),
    contactPhone: string()
      .trim()
      .test(
        "is-valid-phone",
        "Merci de renseigner un numéro de téléphone valide",
        value => !value || validatePhoneNumber(value)
      )
      .required(),
    website: string().url()
  })
  .required();

const CompanyContactForm = ({ company }: ContactFormProps) => {
  const isAdmin = company.userRole === UserRole.Admin;

  const [updateContact, { data, error, loading }] =
    useMutation(UPDATE_CONTACT_INFOS);

  const defaultValues: ContactFormFields = {
    contact: company?.contact || "",
    contactEmail: company?.contactEmail || "",
    contactPhone: company?.contactPhone || "",
    website: company?.website || ""
  };

  const { handleSubmit, reset, formState, register } = useForm({
    defaultValues,
    values: { ...data?.updateCompany }, // will get updated once values returns
    resolver: yupResolver<ObjectSchema<any>>(yupSchema)
  });

  const updateCompanyContact = async (data, onClose) => {
    await updateContact({ variables: { id: company.id, ...data } });
    if (!error) {
      onClose();
    }
  };

  return (
    <CompanyFormWrapper
      title="Coordonnées"
      reset={reset}
      disabled={!formState.isDirty || formState.isSubmitting}
      defaultValues={defaultValues}
      isAdmin={isAdmin}
    >
      {(formRef, isEditing, onClose) =>
        isEditing ? (
          <form
            ref={formRef}
            onSubmit={handleSubmit(
              async data => await updateCompanyContact(data, onClose)
            )}
          >
            <Input
              label="Prénom et nom"
              state={formState.errors.contact ? "error" : "default"}
              nativeInputProps={{
                ...register("contact", { required: true }),
                placeholder: "Prénom et nom"
              }}
              stateRelatedMessage="Ce champ est obligatoire"
            />
            <Input
              label="Email"
              nativeInputProps={{
                type: "email",
                ...register("contactEmail", { required: true }),
                ...{ "data-testid": "company-contact-email" }
              }}
              state={formState.errors.contactEmail ? "error" : "default"}
              stateRelatedMessage="Email invalide"
            />
            <Input
              label="Téléphone"
              nativeInputProps={{
                ...register("contactPhone", { required: true }),
                placeholder: "Téléphone"
              }}
              state={formState.errors.contactPhone ? "error" : "default"}
              stateRelatedMessage="Merci de renseigner un numéro de téléphone valide"
            />
            <Input
              label="Site web (optionnel)"
              nativeInputProps={{
                ...register("website"),
                placeholder: "Site web"
              }}
              state={formState.errors.website ? "error" : "default"}
              stateRelatedMessage="URL invalide"
            />
            {loading && <Loader />}
            {error && <NotificationError apolloError={error} />}
          </form>
        ) : (
          <>
            <p className="companyFormWrapper__title-field">Prénom et nom</p>
            <p className="companyFormWrapper__value-field">
              {company.contact || "-"}
            </p>

            <p className="companyFormWrapper__title-field">Email</p>
            <p className="companyFormWrapper__value-field">
              {company.contactEmail || "-"}
            </p>

            <p className="companyFormWrapper__title-field">Téléphone</p>
            <p className="companyFormWrapper__value-field">
              {company.contactPhone || "-"}
            </p>

            <p className="companyFormWrapper__title-field">Site web</p>
            <p className="companyFormWrapper__value-field">
              {company.website || "-"}
            </p>
          </>
        )
      }
    </CompanyFormWrapper>
  );
};

export default CompanyContactForm;

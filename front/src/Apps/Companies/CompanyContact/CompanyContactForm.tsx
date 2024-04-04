import React, { useState, useEffect, useRef } from "react";
import { CompanyPrivate, UserRole } from "@td/codegen-ui";
import { useForm, SubmitHandler } from "react-hook-form";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { object, string, ObjectSchema } from "yup";
import { useMutation } from "@apollo/client";
import { yupResolver } from "@hookform/resolvers/yup";
import { UPDATE_CONTACT_INFOS } from "../common/queries";
import { NotificationError } from "../../common/Components/Error/Error";
import ContactFormCtaFragment from "./ContactFormCtaFragment";
import { validatePhoneNumber } from "../../../common/helper";
import "./contactForm.scss";

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
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [showEditCta, setShowEditCta] = useState<boolean>(false);
  const isAdmin = company.userRole === UserRole.Admin;
  const formRef = useRef<HTMLFormElement>(null);

  const [updateContact, { data, error }] = useMutation(UPDATE_CONTACT_INFOS);

  useEffect(() => {
    if (isAdmin && !isEditing) {
      setShowEditCta(true);
    }
  }, [isAdmin, isEditing]);

  const defaultValues = {
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

  const onSubmit: SubmitHandler<ContactFormFields> = async data => {
    await updateContact({ variables: { id: company.id, ...data } });
    if (!error) {
      setIsEditing(false);
    }
  };

  const onEditionClick = () => {
    setIsEditing(true);
    setShowEditCta(false);
  };

  const handleReset = reset => {
    reset({ ...defaultValues });
    setIsEditing(false);
    setShowEditCta(isAdmin);
  };
  const handleSubmitFormOnClick = () => {
    formRef.current?.dispatchEvent(
      new Event("submit", { cancelable: true, bubbles: true })
    );
  };

  return (
    <div className="contactForm">
      <div className="contactForm__topActions">
        <h4>Coordonnées</h4>
        {showEditCta && (
          <Button
            data-testid="company-contact-edit"
            size="small"
            onClick={onEditionClick}
          >
            Modifier
          </Button>
        )}

        {isEditing && (
          <ContactFormCtaFragment
            handleReset={() => handleReset(reset)}
            handleSubmit={handleSubmitFormOnClick}
            disabled={!formState.isDirty || formState.isSubmitting}
          />
        )}
      </div>

      {isEditing ? (
        <form ref={formRef} onSubmit={handleSubmit(onSubmit)}>
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

          {error && <NotificationError apolloError={error} />}

          {isEditing && (
            <ContactFormCtaFragment
              handleReset={() => handleReset(reset)}
              disabled={!formState.isDirty || formState.isSubmitting}
              handleSubmit={handleSubmitFormOnClick}
            />
          )}
        </form>
      ) : (
        <>
          <p className="contactForm__title-field">Prénom et nom</p>
          <p className="contactForm__value-field">{company.contact || "-"}</p>

          <p className="contactForm__title-field">Email</p>
          <p className="contactForm__value-field">
            {company.contactEmail || "-"}
          </p>

          <p className="contactForm__title-field">Téléphone</p>
          <p className="contactForm__value-field">
            {company.contactPhone || "-"}
          </p>

          <p className="contactForm__title-field">Site web</p>
          <p className="contactForm__value-field">{company.website || "-"}</p>
        </>
      )}
    </div>
  );
};

export default CompanyContactForm;

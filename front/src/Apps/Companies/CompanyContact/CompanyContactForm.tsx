import React, { useState, useEffect, useRef } from "react";
import { CompanyPrivate, UserRole } from "@td/codegen-ui";
import { useForm, SubmitHandler } from "react-hook-form";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { UPDATE_CONTACT_INFOS } from "../common/queries";
import { useMutation } from "@apollo/client";
import { NotificationError } from "../../common/Components/Error/Error";
import ContactFormCtaFragment from "./ContactFormCtaFragment";
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

const CompanyContactForm = ({ company }: ContactFormProps) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [showEditCta, setShowEditCta] = useState<boolean>(false);
  const isAdmin = company.userRole === UserRole.Admin;
  const formRef = useRef<HTMLFormElement>(null);

  const [updateContact, { error }] = useMutation(UPDATE_CONTACT_INFOS);

  useEffect(() => {
    if (isAdmin && !isEditing) {
      setShowEditCta(true);
    }
  }, [isAdmin, isEditing]);

  const { handleSubmit, reset, formState, register } =
    useForm<ContactFormFields>({
      defaultValues: {
        contact: company?.contact || "",
        contactEmail: company?.contactEmail || "",
        contactPhone: company?.contactPhone || "",
        website: company?.website || ""
      }
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
    reset();
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
          <Button size="small" onClick={onEditionClick}>
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
            nativeInputProps={{ ...register("contact", { required: true }) }}
            stateRelatedMessage="Ce champ est obligatoire"
          />
          <Input
            label="Email"
            nativeInputProps={{
              ...register("contactEmail", { required: true })
            }}
            state={formState.errors.contactEmail ? "error" : "default"}
            stateRelatedMessage="Ce champ est obligatoire"
          />
          <Input
            label="Téléphone"
            nativeInputProps={{
              ...register("contactPhone", { required: true })
            }}
            state={formState.errors.contactPhone ? "error" : "default"}
            stateRelatedMessage="Ce champ est obligatoire"
          />
          <Input
            label="Site web (optionnel)"
            nativeInputProps={{ ...register("website") }}
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

import React, { useState, useEffect, useRef } from "react";
import { CompanyPrivate, UserRole } from "@td/codegen-ui";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
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

const ContactForm = ({ company }: ContactFormProps) => {
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

  const { handleSubmit, control, reset, formState } =
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
          <Controller
            name="contact"
            control={control}
            rules={{ required: true }}
            render={({ field, fieldState }) => (
              <Input
                label="Prénom et nom"
                state={fieldState.invalid ? "error" : "default"}
                nativeInputProps={{ ...field, onChange: field.onChange }}
                stateRelatedMessage="Ce champ est obligatoire"
              />
            )}
          />
          <Controller
            name="contactEmail"
            control={control}
            rules={{ required: true }}
            render={({ field, fieldState }) => (
              <Input
                label="Email"
                nativeInputProps={{ ...field, onChange: field.onChange }}
                state={fieldState.invalid ? "error" : "default"}
                stateRelatedMessage="Ce champ est obligatoire"
              />
            )}
          />
          <Controller
            name="contactPhone"
            control={control}
            rules={{ required: true }}
            render={({ field, fieldState }) => (
              <Input
                label="Téléphone"
                nativeInputProps={{ ...field, onChange: field.onChange }}
                state={fieldState.invalid ? "error" : "default"}
                stateRelatedMessage="Ce champ est obligatoire"
              />
            )}
          />
          <Controller
            name="website"
            control={control}
            rules={{ required: false }}
            render={({ field }) => (
              <Input
                label="Site web (optionnel)"
                nativeInputProps={{ ...field, onChange: field.onChange }}
              />
            )}
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

export default ContactForm;

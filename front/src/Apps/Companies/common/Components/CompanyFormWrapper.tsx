import React, { useEffect, useRef, useState } from "react";
import { Button } from "@codegouvfr/react-dsfr/Button";
import CompanyFormCtaFragment from "./CompanyFormCtaFragment";
import "./companyFormWrapper.scss";

const CompanyFormWrapper = ({
  isAdmin,
  title,
  reset,
  disabled,
  defaultValues,
  children
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [showEditCta, setShowEditCta] = useState<boolean>(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (isAdmin && !isEditing) {
      setShowEditCta(true);
    }
  }, [isAdmin, isEditing]);

  const onEditionClick = () => {
    setIsEditing(true);
    setShowEditCta(false);
  };

  const handleReset = () => {
    reset({ ...defaultValues });
    setIsEditing(false);
    setShowEditCta(isAdmin);
  };
  const handleSubmitFormOnClick = () => {
    formRef.current?.dispatchEvent(
      new Event("submit", { cancelable: true, bubbles: true })
    );
  };

  const onClose = () => {
    setIsEditing(false);
  };

  return (
    <div className="companyFormWrapper">
      <div className="companyFormWrapper__topActions">
        <h4>{title}</h4>
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
          <CompanyFormCtaFragment
            handleReset={handleReset}
            handleSubmit={handleSubmitFormOnClick}
            disabled={disabled}
          />
        )}
      </div>
      {children(formRef, isEditing, onClose)}
      <br />
      {isEditing && (
        <CompanyFormCtaFragment
          handleReset={handleReset}
          handleSubmit={handleSubmitFormOnClick}
          disabled={disabled}
        />
      )}
    </div>
  );
};

export default CompanyFormWrapper;

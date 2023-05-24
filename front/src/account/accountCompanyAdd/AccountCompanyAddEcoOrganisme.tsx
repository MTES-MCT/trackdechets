import React from "react";
import { Field, FieldArray, useField } from "formik";
import RedErrorMessage from "common/components/RedErrorMessage";
import {
  Container,
  Row,
  Col,
  TextInput,
  Text,
  Button,
} from "@dataesr/react-dsfr";

export default function AccountCompanyAddEcoOrganisme() {
  const fieldProps = { name: "ecoOrganismeAgreements" };
  const [field] = useField<string[]>(fieldProps);

  return (
    <Container fluid>
      <Row>
        <Col n="12">
          <Text as="p" bold>
            Agréments éco-organisme
          </Text>
          <RedErrorMessage name="ecoOrganismeAgreements" />
        </Col>
      </Row>
      <FieldArray {...fieldProps}>
        {({ push, remove }) => (
          <>
            {field.value.map((url, index) => (
              <Row gutters key="index">
                <Col n="1">
                  <Text as="span">URL</Text>
                </Col>
                <Col n="9">
                  <Field name={`ecoOrganismeAgreements.${index}`}>
                    {({ field }) => {
                      return (
                        <TextInput
                          type="text"
                          placeholder="https://"
                          {...field}
                        ></TextInput>
                      );
                    }}
                  </Field>
                </Col>
                <Col n="2">
                  <Button
                    icon="ri-delete-bin-line"
                    onClick={() => remove(index)}
                  >
                    Supprimer
                  </Button>
                </Col>
              </Row>
            ))}
            <Row spacing="pt-1w">
              <Col n="12">
                <Button icon="ri-add-line" onClick={() => push("")}>
                  Ajouter un agrément
                </Button>
              </Col>
            </Row>
          </>
        )}
      </FieldArray>
    </Container>
  );
}

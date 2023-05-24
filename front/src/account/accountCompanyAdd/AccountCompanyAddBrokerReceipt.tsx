import React from "react";
import { Field } from "formik";
import RedErrorMessage from "common/components/RedErrorMessage";
import { Container, Row, Col, TextInput, Text } from "@dataesr/react-dsfr";

/**
 * Broker receipt Formik fields for company creation
 */
export default function AccountCompanyAddBrokerReceipt() {
  return (
    <Container fluid>
      <Row>
        <Col n="12">
          <Text as="p" bold>
            Récépissé Courtier (optionnel)
          </Text>
        </Col>
      </Row>
      <Row gutters>
        <Col n="4">
          <Field name="brokerReceiptNumber">
            {({ field }) => {
              return (
                <TextInput label="Numéro de récépissé" {...field}></TextInput>
              );
            }}
          </Field>
          <RedErrorMessage name="brokerReceiptNumber" />
        </Col>
        <Col n="4">
          <Field name="brokerReceiptValidity">
            {({ field }) => {
              return (
                <TextInput
                  type="date"
                  label="Limite de validité"
                  {...field}
                ></TextInput>
              );
            }}
          </Field>
          <RedErrorMessage name="brokerReceiptValidity" />
        </Col>
        <Col n="2">
          <Field name="brokerReceiptDepartment">
            {({ field }) => {
              return (
                <TextInput
                  label="Département"
                  placeholder="75"
                  {...field}
                ></TextInput>
              );
            }}
          </Field>
          <RedErrorMessage name="brokerReceiptDepartment" />
        </Col>
      </Row>
    </Container>
  );
}

import React from "react";
import { Field } from "formik";
import RedErrorMessage from "common/components/RedErrorMessage";
import { Container, Row, Col, TextInput, Text } from "@dataesr/react-dsfr";

/**
 * Trader receipt Formik fields for company creation
 */
export default function AccountCompanyAddTraderReceipt() {
  return (
    <Container fluid>
      <Row>
        <Col n="12">
          <Text as="p" bold>
            Récépissé Négociant (optionnel)
          </Text>
        </Col>
      </Row>
      <Row gutters>
        <Col n="4">
          <Field name="traderReceiptNumber">
            {({ field }) => {
              return (
                <TextInput label="Numéro de récépissé" {...field}></TextInput>
              );
            }}
          </Field>
          <RedErrorMessage name="traderReceiptNumber" />
        </Col>
        <Col n="4">
          <Field name="traderReceiptValidity">
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
          <RedErrorMessage name="traderReceiptValidity" />
        </Col>
        <Col n="2">
          <Field name="traderReceiptDepartment">
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
          <RedErrorMessage name="traderReceiptDepartment" />
        </Col>
      </Row>
    </Container>
  );
}

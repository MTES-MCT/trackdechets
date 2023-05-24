import React from "react";
import { Field } from "formik";
import RedErrorMessage from "common/components/RedErrorMessage";
import {
  Container,
  Row,
  Col,
  TextInput,
  Text,
  Alert,
} from "@dataesr/react-dsfr";

/**
 * Transporter receipt Formik fields for company creation
 */
export default function AccountCompanyAddTransporterReceipt() {
  return (
    <Container fluid>
      <Row spacing="mb-2w">
        <Col n="12">
          <Alert
            title=""
            description={
              <>
                Ce profil comprend uniquement les professionnels avec récépissé.
                Les exemptions de récépissé n'ont pas à utiliser ce profil.{" "}
                <a
                  href="https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044266537/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Article R.541-50 du code de l'environnement
                </a>
                .
              </>
            }
            type="info"
          />
        </Col>
      </Row>
      <Row>
        <Col n="12">
          <Text as="p" bold>
            Récépissé Transporteur (optionnel)
          </Text>
        </Col>
      </Row>
      <Row gutters>
        <Col n="4">
          <Field name="transporterReceiptNumber">
            {({ field }) => {
              return (
                <TextInput label="Numéro de récépissé" {...field}></TextInput>
              );
            }}
          </Field>
          <RedErrorMessage name="transporterReceiptNumber" />
        </Col>
        <Col n="4">
          <Field name="transporterReceiptValidity">
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
          <RedErrorMessage name="transporterReceiptValidity" />
        </Col>
        <Col n="2">
          <Field name="transporterReceiptDepartment">
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
          <RedErrorMessage name="transporterReceiptDepartment" />
        </Col>
      </Row>
    </Container>
  );
}

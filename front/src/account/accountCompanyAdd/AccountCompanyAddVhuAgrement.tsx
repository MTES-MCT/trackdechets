import React from "react";
import { Field } from "formik";
import RedErrorMessage from "common/components/RedErrorMessage";
import { Container, Row, Col, TextInput, Text } from "@dataesr/react-dsfr";

/**
 * Vhu agrement Formik fields for company creation
 */
export default function AccountCompanyAddVhuAgrement() {
  return (
    <Container fluid>
      <Row>
        <Col n="12">
          <Text as="p" bold>
            Agrément démolisseur - casse automobile (optionnel)
          </Text>
        </Col>
      </Row>
      <Row gutters spacing="mb-2w">
        <Col n="4">
          <Field name="vhuAgrementDemolisseurNumber">
            {({ field }) => {
              return (
                <TextInput label="Numéro d'agrément" {...field}></TextInput>
              );
            }}
          </Field>
          <RedErrorMessage name="vhuAgrementDemolisseurNumber" />
        </Col>
        <Col n="4">
          <Field name="vhuAgrementDemolisseurDepartment">
            {({ field }) => {
              return (
                <TextInput
                  placeholder="75"
                  label="Numéro d'agrément"
                  {...field}
                ></TextInput>
              );
            }}
          </Field>
          <RedErrorMessage name="vhuAgrementDemolisseurDepartment" />
        </Col>
      </Row>
      <Row>
        <Col n="12">
          <Text as="p" bold>
            Agrément broyeur (optionnel)
          </Text>
        </Col>
      </Row>
      <Row gutters>
        <Col n="4">
          <Field name="vhuAgrementBroyeurNumber">
            {({ field }) => {
              return (
                <TextInput label="Numéro d'agrément" {...field}></TextInput>
              );
            }}
          </Field>
          <RedErrorMessage name="vhuAgrementBroyeurNumber" />
        </Col>
        <Col n="4">
          <Field name="vhuAgrementBroyeurDepartment">
            {({ field }) => {
              return (
                <TextInput
                  placeholder="75"
                  label="Numéro d'agrément"
                  {...field}
                ></TextInput>
              );
            }}
          </Field>
          <RedErrorMessage name="vhuAgrementBroyeurDepartment" />
        </Col>
      </Row>
    </Container>
  );
}

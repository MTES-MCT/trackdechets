import React from "react";
import { Field, useFormikContext } from "formik";
import RedErrorMessage from "common/components/RedErrorMessage";
import {
  Container,
  Row,
  Col,
  TextInput,
  Select,
  Checkbox,
} from "@dataesr/react-dsfr";
import Tooltip from "common/components/Tooltip";

import { Values } from "../AccountCompanyAdd";

/**
 * Broker receipt Formik fields for company creation
 */
export default function AccountCompanyAddBrokerReceipt() {
  const { values } = useFormikContext<Values>();

  return (
    <Container fluid>
      <Row gutters>
        <Col n="12">
          <Field name="hasSubSectionFour">
            {({ field }) => {
              return (
                <Checkbox
                  id="hasSubSectionFour"
                  label="Travaux relevant de la sous-section 4"
                  {...field}
                ></Checkbox>
              );
            }}
          </Field>
        </Col>
      </Row>
      <Row gutters>
        <Col n="11">
          <Field name="hasSubSectionThree">
            {({ field }) => {
              return (
                <Checkbox
                  id="hasSubSectionThree"
                  label="Travaux relevant de la sous-section 3"
                  {...field}
                ></Checkbox>
              );
            }}
          </Field>
        </Col>
        <Col n="1">
          <Tooltip msg="Ce profil correspond à une entreprise disposant d'une certification Amiante (NFX 46-010)" />
        </Col>
      </Row>
      {values.hasSubSectionThree && (
        <Row gutters>
          <Col n="4">
            <Field name="certificationNumber">
              {({ field }) => {
                return (
                  <TextInput label="N° certification" {...field}></TextInput>
                );
              }}
            </Field>
            <RedErrorMessage name="certificationNumber" />
          </Col>
          <Col n="4">
            <Field name="validityLimit">
              {({ field }) => {
                return (
                  <TextInput
                    type="date"
                    label="Date de validité"
                    {...field}
                  ></TextInput>
                );
              }}
            </Field>
            <RedErrorMessage name="validityLimit" />
          </Col>
          <Col n="4">
            <Field name="organisation">
              {({ field }) => {
                return (
                  <Select
                    label="Département"
                    options={[
                      {
                        value: "AFNOR Certification",
                        label: "AFNOR Certification",
                      },
                      {
                        value: "QUALIBAT",
                        label: "QUALIBAT",
                      },
                    ]}
                    {...field}
                    selected={values.organisation}
                  ></Select>
                );
              }}
            </Field>
            <RedErrorMessage name="organisation" />
          </Col>
        </Row>
      )}
    </Container>
  );
}

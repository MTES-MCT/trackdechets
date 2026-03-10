import { gql } from "@apollo/client";

export const GET_CITY_NAME_BY_INSEE_CODE = gql`
  query GetCityNameByInseeCode($inseeCode: String!) {
    getCityNameByInseeCode(inseeCode: $inseeCode)
  }
`;

export const GET_COMMUNE_BY_COORDINATES = gql`
  query GetCommuneByCoordinates($lat: Float!, $lng: Float!) {
    getCommuneByCoordinates(lat: $lat, lng: $lng) {
      inseeCode
      city
    }
  }
`;

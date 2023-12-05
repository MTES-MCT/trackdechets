# EU VAT Number search module

Validate a company by its VAT number

## About VAT number format

| Member State / Northern Ireland | Structure                                                   | Format                                                                                                                                     |
| ------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| AT-Austria                      | ATU999999991                                                | 1 block of 9 characters                                                                                                                    |
| BE-Belgium                      | BE0999999999 BE1999999999                                   | 1 block of 10 digits                                                                                                                       |
| BG-Bulgaria                     | BG999999999 or BG9999999999                                 | 1 block of 9 digits or1 block of 10 digits                                                                                                 |
| CY-Cyprus                       | CY99999999L                                                 | 1 block of 9 characters                                                                                                                    |
| CZ-Czech Republic               | CZ99999999 or CZ999999999 or CZ9999999999                   | 1 block of either 8, 9 or 10 digits                                                                                                        |
| DE-Germany                      | DE999999999                                                 | 1 block of 9 digits                                                                                                                        |
| DK-Denmark                      | DK99 99 99 99                                               | 4 blocks of 2 digits                                                                                                                       |
| EE-Estonia                      | EE999999999                                                 | 1 block of 9 digits                                                                                                                        |
| EL-Greece                       | EL999999999                                                 | 1 block of 9 digits                                                                                                                        |
| ES-Spain                        | ESX9999999X4                                                | 1 block of 9 characters                                                                                                                    |
| FI-Finland                      | FI99999999                                                  | 1 block of 8 digits                                                                                                                        |
| FR-France                       | FRXX 999999999                                              | 1 block of 2 characters, 1 block of 9 digits                                                                                               |
| HR-Croatia                      | HR99999999999                                               | 1 block of 11 digits                                                                                                                       |
| HU-Hungary                      | HU99999999                                                  | 1 block of 8 digits                                                                                                                        |
| IE-Ireland                      | IE9S99999L IE9999999WI                                      | 1 block of 8 characters or 1 block of 9 characters                                                                                         |
| IT-Italy                        | IT99999999999                                               | 1 block of 11 digits                                                                                                                       |
| LT-Lithuania                    | LT999999999 or LT999999999999                               | 1 block of 9 digits, or 1 block of 12 digits                                                                                               |
| LU-Luxembourg                   | LU99999999                                                  | 1 block of 8 digits                                                                                                                        |
| LV-Latvia                       | LV99999999999                                               | 1 block of 11 digits                                                                                                                       |
| MT-Malta                        | MT99999999                                                  | 1 block of 8 digits                                                                                                                        |
| NL-The Netherlands              | NLSSSSSSSSSSSS                                              | 1 block of 12 characters                                                                                                                   |
| PL-Poland                       | PL9999999999                                                | 1 block of 10 digits                                                                                                                       |
| PT-Portugal                     | PT999999999                                                 | 1 block of 9 digits                                                                                                                        |
| RO-Romania                      | RO999999999                                                 | 1 block of minimum 2 digits and maximum 10 digits                                                                                          |
| SE-Sweden                       | SE999999999999                                              | 1 block of 12 digits                                                                                                                       |
| SI-Slovenia                     | SI99999999                                                  | 1 block of 8 digits                                                                                                                        |
| SK-Slovakia                     | SK9999999999                                                | 1 block of 10 digits                                                                                                                       |
| XI-Northern Ireland             | XI999 9999 99 or XI999 9999 99 9995 or XIGD9996 or XIHA9997 | 1 block of 3 digits, 1 block of 4 digits and 1 block of 2 digits; or the above followed by a block of 3 digits; or 1 block of 5 characters |

## About VIES (European commission SOAP Api)

- [data.europe.eu general description](https://data.europa.eu/data/datasets/vies-vat-information-exchange-system?locale=en)
- [VIES FAQ](https://ec.europa.eu/taxation_customs/vies/faq.html)
- In the case of a valid VAT number, if the name and/or address are replaced by '---', this means that the VAT number authority does not allow to disclose this information.
- There is unavailability shifts depending on the country, check [the website](https://ec.europa.eu/taxation_customs/vies/help.html) for more informations
- We should cache the result for 24h according to the SOAP API
- If our server IP is blocked it's because they flagged us. As a consequenc, we may not increase the ratelimit to the `searchVat` client unless we are sure we won't get blocked.
- If a valid VAT number is not found, it's may be the fault of the country's TAX administration did not update their databases. VIES only fetch the countries' registries.

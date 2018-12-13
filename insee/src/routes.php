<?php

use GuzzleHttp\Client;
use Slim\Http\Request;
use Slim\Http\Response;

// Routes

$app->get('/siret/{siret}', function (Request $request, Response $response, array $args) {

    $stripped_siret = str_replace(' ', '', $args['siret']);
    if (strlen($stripped_siret) != 14) {
      return $response->withJson(["error" => "Le SIRET doit faire 14 caractères."], 403);
    }

    $headers = [
      'Authorization' => 'Bearer ' . "c77aa7ba-a266-3d71-80b7-88f1b682df3e",
      'Accept'        => 'application/json',
    ];
    $client = new Client([
      'base_uri' => 'https://api.insee.fr/entreprises/sirene/V3/siret/',
      'timeout'  => 5.0,
      'headers'  => $headers
    ]);

    try {
      $apiResponse = $client->get($stripped_siret);
      $json = json_decode($apiResponse->getBody());

      return $response->withJson([
        "siret" => $stripped_siret,
        "siren" => $json->etablissement->siren,
        "name" => $json->etablissement->uniteLegale->denominationUniteLegale,
        "address" =>  $json->etablissement->adresseEtablissement->numeroVoieEtablissement .
         ' ' . $json->etablissement->adresseEtablissement->typeVoieEtablissement .
         ' ' . $json->etablissement->adresseEtablissement->libelleVoieEtablissement .
         ', ' . $json->etablissement->adresseEtablissement->codePostalEtablissement .
         ' ' . $json->etablissement->adresseEtablissement->libelleCommuneEtablissement
      ]);
    } catch (Exception $e) {
      print_r($e);
      return $response->withJson(["error" => "Impossible de récupérer les informations de l'entreprise"], 501);
    }

});

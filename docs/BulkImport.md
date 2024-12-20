# Importation en masse d'établissements/comptes

## Prérequis

- avoir récupéré xlsx2csv.py sur https://github.com/dilshod/xlsx2csv
- avoir Python 3 installé

## Méthode facile :

définir TD_XSLX2CSV_PATH dans le .env avec le chemin où se trouve xlsx2csv.py, puis run `./scripts/run-import.sh`

## Méthode manuelle

Il semblerait que xlsx2csv.py ait changé avec le temps et ne soit plus compatible avec le script. Voici donc la méthode pour faire les étapes manuellement en cas de problème :

```
python3 xlsx2csv.py -a -d=";" import.xlsx out
```

L'argument -a permet d'exporter toutes les feuilles (roles et établissements). L'argument -d permet de spécifier le séparateur pour que le parsing fonctionne.

-> vérifier que les csv ont bien été créés, ne contiennent pas de tabulations, de lignes vides, ...

Se connecter sur une one-off de la prod tout en chargeant les fichiers

```
scalingo --region osc-secnum-fr1 --app trackdechets-production-api run --file out bash
```

Décompresser les fichiers

```
tar -C /tmp -xvf /tmp/uploads/out.tar.gz
```

Installer des dépendances

```
npm i
```

Exécuter le script d'import

```
tsx --tsconfig back/tsconfig.lib.json back/src/users/bulk-creation/index.ts --csvDir=/tmp/
```

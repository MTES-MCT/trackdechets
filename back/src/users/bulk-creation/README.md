Script for bulk creating accounts and companies from csv files
Cf [Création de comptes Trackdéchets en masse](https://forum.trackdechets.beta.gouv.fr/t/creation-de-comptes-trackdechets-en-masse/31)

The script should be executed from within the container,
Provided you have a csv folder on your host, you can add it
to the container with. Two csv files should be present:

* etablissements.csv
* roles.csv

```
docker cp csv {container_id}:/usr/src/app/csv`
docker exec -it {container_id} bash
npm run bulk-create-account -- --validateOnly
```


```
Usage npm run bulk-create-account [options]

Bulk load a list of companies and users to Trackdéchets

Options:

-- --help                       Print help
-- --validateOnly               Only perform validation csv files
-- --csvDir=/path/to/csv/dir    Specify custom csv directory, default to /usr/src/app/csv
```
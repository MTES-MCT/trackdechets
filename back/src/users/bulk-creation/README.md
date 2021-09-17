Nous possédons un script permettant de créer des établissements et comptes utilisateur en masse.
Les pré-requis sont détaillés ici : https://faq.trackdechets.fr/informations-generiques/sinscrire/je-cree-de-compte/creer-des-comptes-en-masse

Afin de faire fonctionner le script, deux fichiers CSV sont nécessaires :

- etablissements.csv
- roles.csv

Le script fait un certain nombre de vérifications pour éviter les erreurs mais il est toujours préférable de faire un contrôle du contenu.

Le script est à faire tourner sur l'environnement qui vous intéresse.
Il faudra l'exécuter sur l'environnement de recette pour créer les comptes sur recette, sur sandbox pour sandbox et sur la production pour la production.

La démarche est la suivante :

1. Sur votre machine, créer un répertoire `csv` qui contient les fichiers `etablissements.csv` et `roles.csv`.
2. Se connecter à la machine qui vous intéresse en faisant au passage l'upload des fichiers :
   ```
   scalingo --app trackdechets-production-api run --file ~/Desktop/csv bash
   ```
   Le répertoire `csv` va être envoyé sous la forme d'une archive `.tar` dans le répertoire `/tmp/uploads`.
3. À ce stade, vous devriez avoir un accès bash à la machine. Commencez par désarchiver votre répertoire :
   ```
   tar -C /tmp -xvf /tmp/uploads/csv.tar.gz
   ```
4. Éxécutez le script :
   ```
   node ./dist/src/users/bulk-creation/index.js --validateOnly --csvDir=/tmp/
   ```
   Note : le flag `--validateOnly` permet de faire une simple vérification sans créer les comptes.
   Relancez la commande sans ce flag pour créer les comptes.

Pour plus de détails sur l'exécution de tâches dans une application Scalingo, voir :

- https://doc.scalingo.com/platform/app/tasks

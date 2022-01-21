# Usage 

Ce module fait partie du Yarn Workspace 'trackdechets', dossier parent.

Pour l'utiliser dans un autre module client du workspace:
- ajouter le chemin `common/` dans le tsconfiug.json
```
"references": [
    {
      "path": "../common"
    }
  ]
```
- s'assurer que l'option `"composite": true` est présenter dans le tsconfig.json du client

- l'ajouter dans les dépendances `@trackdechets/common`
- l'importer dans le code client : `import * from "@trackdechets/common";`

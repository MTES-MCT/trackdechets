# Status

- Basé sur [Cachet](https://docs.cachethq.io/docs/welcome) & [Cachet-monitor](https://github.com/CastawayLabs/cachet-monitor)
- Doit etre déployé sur un serveur **différent du serveur de production**. Puis accessbile à une adresse du type `status.trackdechets.fr`
- Le monitor fait des pings réguliers sur les services définis dans le fichier `monitor/config.json` et crée des incidents automatiquement en cas de problème
- Il est également possible de créer et résoudre des incidents à la main dans Cachet

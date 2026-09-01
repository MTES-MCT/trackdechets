import { FluidesFrigorigenesIntervention } from "./model";

// Temporary fixture. Delete this file when the Trackdechets backend query is available.
export const mockFluidesFrigorigenesInterventions: FluidesFrigorigenesIntervention[] =
  [
    {
      id: "fi-1",
      number: "FI-2026-001",
      wasteCode: "14 06 01*",
      equipmentHolder: "Leclerc Millau",
      weightKg: 8,
      interventionDate: "2026-08-18",
      isAssociated: false,
      containers: [
        { id: "b-1", number: "BOUT-001", volumeLiters: 25, weightKg: 5 },
        { id: "b-2", number: "BOUT-002", volumeLiters: 15, weightKg: 3 }
      ]
    },
    {
      id: "fi-2",
      number: "FI-2026-002",
      wasteCode: "14 06 02*",
      equipmentHolder: "Hôtel des Causses",
      weightKg: 5,
      interventionDate: "2026-08-20",
      isAssociated: false,
      containers: [
        { id: "b-3", number: "BOUT-003", volumeLiters: 20, weightKg: 5 }
      ]
    },
    {
      id: "fi-3",
      number: "FI-2026-003",
      wasteCode: "14 06 02*",
      equipmentHolder: "Leclerc Millau",
      weightKg: 10,
      interventionDate: "2026-08-25",
      isAssociated: true,
      containers: [
        { id: "b-4", number: "BOUT-004", volumeLiters: 30, weightKg: 10 }
      ]
    }
  ];

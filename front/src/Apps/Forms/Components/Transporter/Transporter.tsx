import * as React from "react";
import { Transporter } from "codegen-ui/src";

type TransporterFieldProps = {
  label: string;
  value: string;
};

type TransporterProps = {
  transporter: Transporter;
};

function TransporterField({ label, field }: TransporterFieldProps);

/**
 * Ce composant permet de représenter les données d'un transporteur
 * dans la liste des transporteurs lorsque la prise en charge du déchet
 * a déjà été effectuée (`takenOverAt` non nul) et que les champs du
 * formulaire ne sont par conséquent plus modifiables.
 */
export default function Transporter({ transporter }: TransporterProps) {}

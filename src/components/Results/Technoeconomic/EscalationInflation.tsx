import React from 'react';
import { formatNumber } from '../../Shared/util';
import {
  InputModGPO,
  InputModCHP,
  InputModGP
} from '@ucdavis/tea/out/models/input.model';
import { InputModGPClass } from '../../../models/GPClasses';
import { InputModGPOClass } from '../../../models/GPOClasses';
import { InputModCHPClass } from '../../../models/CHPClasses';

interface Props {
  inputs: InputModGPO | InputModCHP | InputModGP;
}

export const EscalationInflation = (props: Props) => {
  return (
    <div>
      <h3>Escalation/Inflation</h3>
      <table className='table'>
        <tbody>
          <tr>
            <td>General Inflation (%/y)</td>
            <td>{formatNumber(props.inputs.GeneralInflation)}</td>
          </tr>
          {(props.inputs instanceof InputModGPOClass ||
            props.inputs instanceof InputModCHPClass) && (
            <tr>
              <td>Esclation--Fuel (%/y)</td>
              <td>{formatNumber(props.inputs.EscalationFuel)}</td>
            </tr>
          )}
          {props.inputs instanceof InputModGPClass && (
            <>
              <tr>
                <td>Escalation--Biomass Fuel (%/y)</td>
                <td>{formatNumber(props.inputs.EscalationBiomassFuel)}</td>
              </tr>
              <tr>
                <td>Escalation--Dual Fuel (%/y)</td>
                <td>{formatNumber(props.inputs.EscalationDualFuel)}</td>
              </tr>
              <tr>
                <td>Escalation--Heat sales (%/y)</td>
                <td>{formatNumber(props.inputs.EscalationHeatSales)}</td>
              </tr>
              <tr>
                <td>Escalation--Char/Ash sales (%/y)</td>
                <td>{formatNumber(props.inputs.EscalationCharSales)}</td>
              </tr>
            </>
          )}
          <tr>
            <td>Escalation for Production Tax Credit</td>
            <td>{formatNumber(props.inputs.EscalationProductionTaxCredit)}</td>
          </tr>
          <tr>
            <td>Escalation--Other (%/y)</td>
            <td>{formatNumber(props.inputs.EscalationOther)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

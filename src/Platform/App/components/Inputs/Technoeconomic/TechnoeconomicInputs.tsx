import React, { useEffect, useState } from 'react';
import { Button, Input, Label, FormGroup, Form } from 'reactstrap';
import { GenericPowerOnly } from './GenericPowerOnly/GenericPowerOnly';
import { TechnoeconomicModels } from '../../../models/Types';
import { InputModGPO, InputModCHP, InputModGP } from '@ucdavis/tea/input.model';
import { CombinedHeatAndPower } from './GenericCombinedHeatPower/CombinedHeatAndPower';
import { GasificationPower } from './GasificationPower/GasificationPower';
import { BasicTeaInputs } from './BasicTeaInputs';
import { InputModGPOClass } from '../../../models/GPOClasses';
import { InputModGPClass } from '../../../models/GPClasses';
import { InputModCHPClass } from '../../../models/CHPClasses';
import { StyledInput } from '../Frcs/FrcsInputsContainer';

interface Props {
  teaInputs: InputModGPO | InputModCHP | InputModGP;
  setTeaInputs: (inputs: InputModGPO | InputModCHP | InputModGP) => void;
  teaModel: string;
  setTeaModel: (model: string) => void;
  disabled: boolean;
}

export const determineScaledCost = (
  defaultElectricCapacity: number,
  electricalCapacity: number,
  defaultCost: number
) => {
  // source: https://evcvaluation.com/wp-content/uploads/2019/06/Cost-to-Capacity-Method_Applications-and-Considerations.pdf
  const scaleFactor = 0.82;
  if (electricalCapacity === defaultElectricCapacity) {
    return defaultCost;
  } else {
    const scaledCost =
      defaultCost *
      Math.pow(electricalCapacity / defaultElectricCapacity, scaleFactor);

    return Math.round(scaledCost);
  }
};

const defaultInputsGPO = new InputModGPOClass();
const defaultInputsCHP = new InputModCHPClass();
const defaultInputsGP = new InputModGPClass();

export const TechnoeconomicInputs = (props: Props) => {
  useEffect(() => {
    // ! WHY IS CapitalCostManuallySet USED BELOW?????? Looks like a bool val
    if ((props.teaInputs as any).CapitalCostManuallySet) {
      props.teaInputs.CapitalCost = Number(props.teaInputs.CapitalCost);
      return;
    }

    let scaledCapitalCost = props.teaInputs.CapitalCost;
    switch (props.teaModel) {
      case TechnoeconomicModels.genericPowerOnly:
        scaledCapitalCost = determineScaledCost(
          defaultInputsGPO.ElectricalFuelBaseYear.NetElectricalCapacity,
          props.teaInputs.ElectricalFuelBaseYear.NetElectricalCapacity,
          defaultInputsGPO.CapitalCost
        );
        break;
      case TechnoeconomicModels.genericCombinedHeatAndPower:
        scaledCapitalCost = determineScaledCost(
          defaultInputsCHP.ElectricalFuelBaseYear.NetElectricalCapacity,
          props.teaInputs.ElectricalFuelBaseYear.NetElectricalCapacity,
          defaultInputsCHP.CapitalCost
        );
        break;
      case TechnoeconomicModels.gasificationPower:
        scaledCapitalCost = determineScaledCost(
          defaultInputsGP.ElectricalFuelBaseYear.NetElectricalCapacity,
          props.teaInputs.ElectricalFuelBaseYear.NetElectricalCapacity,
          defaultInputsGP.CapitalCost
        );
        break;
    }

    if (scaledCapitalCost !== props.teaInputs.CapitalCost) {
      props.setTeaInputs({
        ...props.teaInputs,
        CapitalCost: scaledCapitalCost
      });
    }
  }, [props, props.teaInputs.ElectricalFuelBaseYear.NetElectricalCapacity]);

  const [showDetailedInputs, toggleShowDetailedInputs] = useState<boolean>(
    false
  );

  const renderInputs = showDetailedInputs ? (
    <>
      {props.teaModel === TechnoeconomicModels.genericPowerOnly && (
        // props.teaInputs instanceof InputModGPOClass && (
        <GenericPowerOnly
          inputs={props.teaInputs}
          setInputs={props.setTeaInputs}
          teaInputs={props.teaInputs}
          teaModel={props.teaModel}
          disabled={props.disabled}
        />
      )}
      {props.teaModel === TechnoeconomicModels.genericCombinedHeatAndPower && (
        // props.teaInputs instanceof InputModCHPClass && (
        <CombinedHeatAndPower
          inputs={props.teaInputs}
          setInputs={props.setTeaInputs}
          teaInputs={props.teaInputs}
          teaModel={props.teaModel}
          disabled={props.disabled}
        />
      )}
      {props.teaModel === TechnoeconomicModels.gasificationPower && (
        // props.teaInputs instanceof InputModGPClass && (
        <GasificationPower
          inputs={props.teaInputs}
          setInputs={props.setTeaInputs}
          teaInputs={props.teaInputs}
          teaModel={props.teaModel}
          disabled={props.disabled}
        />
      )}
    </>
  ) : (
      <BasicTeaInputs
        inputs={props.teaInputs.ElectricalFuelBaseYear}
        setInputs={(inputs: any) =>
          props.setTeaInputs({
            ...props.teaInputs,
            ElectricalFuelBaseYear: inputs
          })
        }
        teaModel={props.teaModel}
        disabled={props.disabled}
        teaInputs={props.teaInputs}
        setTeaInputs={props.setTeaInputs}
      />
  );
  return (
    <div className='cardcontents'>
      <h4 className='font-bold mb-2'>Techno-Economic Assessment </h4>
      <Button
        color='outline-primary'
        size='sm'
        onClick={() => toggleShowDetailedInputs(!showDetailedInputs)}
      >
        {showDetailedInputs
          ? 'Hide More Detailed Inputs'
          : 'View More Detailed Inputs'}
      </Button>
      <Form>
        <FormGroup className='flex flex-col items-start justify-center mt-2'>
          <Label>Model</Label>
          <StyledInput
            className='w-full text-gray-700'
            type='select'
            onChange={(x:any) => props.setTeaModel(x.target.value)}
            value={props.teaModel}
            disabled={props.disabled}
            >
              <option value={TechnoeconomicModels.genericPowerOnly}>
                Generic Power Only (GPO)
              </option>
              <option value={TechnoeconomicModels.genericCombinedHeatAndPower}>
                Generic Combined Heat and Power (CHP)
              </option>
              <option value={TechnoeconomicModels.gasificationPower}>
                Gasification Power (GP)
              </option>
            </StyledInput>
        </FormGroup>
        {renderInputs}
      </Form>
      <hr />
    </div>
  );
};

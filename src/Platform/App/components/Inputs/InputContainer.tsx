import { InputModCHP, InputModGP, InputModGPO } from '@ucdavis/tea/input.model';
import {
  Button,
  Form,
  FormGroup,
  Input,
  InputGroup,
  InputGroupText,
  Label,
  Spinner,
} from 'reactstrap';
import { useSaveModel } from '../../../Context/saveModel';
import { trackEvent } from '../../../Utils/gaAnalytics';
import { FrcsInputs, MapCoordinates, TransportInputs } from '../../models/Types';
import { HomeButton } from '../Shared/Button';
import { FrcsInputsContainer } from './Frcs/FrcsInputsContainer';
import { TechnoeconomicInputs } from './Technoeconomic/TechnoeconomicInputs';
import { TransportInputsContainer } from './Transportation/TransportationInputs';

interface Props {
  facilityCoordinates: MapCoordinates;
  setFacilityCoordinates: (coordinates: MapCoordinates) => void;
  biomassCoordinates: MapCoordinates;
  setBiomassCoordinates: (coordinates: MapCoordinates) => void;
  selectBiomassCoordinates: boolean;
  setSelectBiomassCoordinates: (val: boolean) => void;
  expansionFactor: number;
  setExpansionFactor: (val: number) => void;
  frcsInputs: FrcsInputs;
  setFrcsInputs: (inputs: FrcsInputs) => void;
  transportInputs: TransportInputs;
  setTransportInputs: (inputs: TransportInputs) => void;
  teaInputs: InputModGPO | InputModCHP | InputModGP;
  setTeaInputs: (inputs: InputModGPO | InputModCHP | InputModGP) => void;
  teaModel: string;
  setTeaModel: (model: string) => void;
  submitInputs: () => void;
  loading: boolean;
  disabled: boolean;
  errors: string[];
}

export const InputContainer = (props: Props) => {
  const { updateLinkCopied } = useSaveModel();

  const handleClick = () => {
    trackEvent('Model Run', 'Click', 'Run Model')
    updateLinkCopied(false);
    props.submitInputs();
  };

  const button = (!props.disabled || props.loading) && (
    <div className='cardcontents'>
      <ul>
        {props.errors.map((error, i) => {
          return (
            <li style={{ color: 'red' }} key={`error-${i}`}>
              {error}
            </li>
          );
        })}
      </ul>
      <Button
        className='btn-block'
        color='primary'
        onClick={handleClick}
        disabled={props.loading}
      >
        {props.loading ? (
          <>
            Running Model
            <Spinner size="sm" color='light' className='ml-2'>
              {''}
            </Spinner>
          </>
        ) : (
          <>Run Model</>
        )}
      </Button>
      <br />
    </div>
  );

  return (
    <>
      <div className='cardheader flex flex-col justify-between items-start'>
        <div className='text-white text-12p'>
            Forest Resource and Renewable Energy Decision Support System
            (FRREDSS)
          </div>
          <div className="flex items-center justify-between gap-x-2 w-full mt-2">
              <div className='text-white text-24p'>Select Inputs</div>
              <div className="flex items-center justify-center gap-x-2">
                {props.loading && (
                  <Spinner size="sm" color='light' className='mr-2'>
                  {''}
                  </Spinner>
                )}
                <HomeButton 
                  loading={props.loading}
                  tooltipText='Go To Home' 
                  tooltipTarget='goToHomeButton'
                />
              </div>
          </div>
      </div>
      <div className='cardcontents'>
        <h4 className='font-bold mb-2'>Forestry and Conversion</h4>
        <Form>
          <FormGroup>
            <Label>Facility Coordinates</Label>
            <InputGroup>
                <InputGroupText>lat</InputGroupText>
              <Input
                type='number'
                value={props.facilityCoordinates.lat.toString()}
                onChange={e =>
                  props.setFacilityCoordinates({
                    ...props.facilityCoordinates,
                    lat: parseFloat(e.target.value) || 0
                  })
                }
                disabled={props.disabled}
              />
            </InputGroup>
            <InputGroup>
                <InputGroupText>lng</InputGroupText>
              <Input
                type='number'
                value={props.facilityCoordinates.lng.toString()}
                onChange={e =>
                  props.setFacilityCoordinates({
                    ...props.facilityCoordinates,
                    lng: parseFloat(e.target.value) || 0
                  })
                }
                disabled={props.disabled}
              />
            </InputGroup>
          </FormGroup>
          <FormGroup className='ml-4'>
            <Label check>
              <Input
                type='checkbox'
                checked={props.selectBiomassCoordinates}
                onChange={e => {
                  if (!e.target.checked) {
                    // if we are unchecking the box, set the biomass to whatever the facility location is
                    props.setBiomassCoordinates({
                      ...props.facilityCoordinates
                    });
                  }
                  props.setSelectBiomassCoordinates(e.target.checked);
                }}
              />{' '}
              Select Separate Biomass Coordinates
            </Label>
          </FormGroup>
          {props.selectBiomassCoordinates && (
            <FormGroup>
              <Label>Biomass Coordinates</Label>
              <InputGroup>
                  <InputGroupText>lat</InputGroupText>
                <Input
                  type='number'
                  value={props.biomassCoordinates.lat.toString()}
                  onChange={e =>
                    props.setBiomassCoordinates({
                      ...props.biomassCoordinates,
                      lat: parseFloat(e.target.value) || 0
                    })
                  }
                  disabled={props.disabled}
                />
              </InputGroup>
              <InputGroup>
                  <InputGroupText>lng</InputGroupText>
                <Input
                  type='number'
                  value={props.biomassCoordinates.lng.toString()}
                  onChange={e =>
                    props.setBiomassCoordinates({
                      ...props.biomassCoordinates,
                      lng: parseFloat(e.target.value) || 0
                    })
                  }
                  disabled={props.disabled}
                />
              </InputGroup>
            </FormGroup>
          )}
          <FormGroup>
            <Label>Expansion Factor</Label>
            <InputGroup>
              <Input
                type='number'
                value={props.expansionFactor.toString()}
                onChange={e =>
                  props.setExpansionFactor(parseFloat(e.target.value) || 0)
                }
                disabled={props.disabled}
              />
            </InputGroup>
          </FormGroup>
        </Form>
      </div>

      <FrcsInputsContainer
        inputs={props.frcsInputs}
        setInputs={props.setFrcsInputs}
        disabled={props.disabled}
      />
      <TransportInputsContainer
        inputs={props.transportInputs}
        setTransportInputs={props.setTransportInputs}
        disabled={props.disabled}
      />
      <TechnoeconomicInputs
        teaInputs={props.teaInputs}
        setTeaInputs={props.setTeaInputs}
        teaModel={props.teaModel}
        setTeaModel={props.setTeaModel}
        disabled={props.disabled}
      />
      {button}
    </>
  );
};

import { faCheck, faDownload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { InputModCHP, InputModGP, InputModGPO } from '@ucdavis/tea/input.model';
import { OutputModSensitivity } from '@ucdavis/tea/output.model';
import { useState } from 'react';
import ReactGA from 'react-ga4';
import {
  Modal,
  Pagination,
  PaginationItem,
  PaginationLink,
  Progress,
  Spinner
} from 'reactstrap';
import { useSaveModel } from '../../../Context/saveModel';
import { AllYearsResults, FrcsInputs, YearlyResult } from '../../models/Types';
import UserDetails from '../Form/UserDetails';
import { HomeButton } from '../Shared/Button';
import { AllResultsContainer } from './AllResultsContainer';
import { YearlyResultsContainer } from './YearlyResultsContainer';

interface Props {
  years: number[];
  selectedYearIndex: number;
  setSelectedYearIndex: (index: number) => void;
  showGeoJson: boolean;
  toggleGeoJson: (toggle: boolean) => void;
  showErrorGeoJson: boolean;
  toggleErrorGeoJson: (toggle: boolean) => void;
  allYearResults: AllYearsResults;
  yearlyResults: YearlyResult[];
  loading: boolean;
  teaInputs: InputModGPO | InputModCHP | InputModGP;
  teaModel: string;
  toggleShowResults: (toggle: boolean) => void;
  showResults: boolean;
  frcsInputs: FrcsInputs;
  sensitivityResults?: OutputModSensitivity;
  expansionFactor: number;
  saveUrl: string | '';
}

export const ResultsContainer = (props: Props) => {
  const [modal, setModal] = useState(false);
  const { linkCopied, updateLinkCopied } = useSaveModel();

  const pages = props.years.map((year, i) => (
    <PaginationItem key={`year-${i}`} active={props.selectedYearIndex === i}>
      <PaginationLink
        className='years-page'
        disabled={!props.yearlyResults[i]}
        onClick={() => props.setSelectedYearIndex(i)}
      >
        {year}
        {!props.yearlyResults[i] && <Spinner size="sm" color='primary'>
              {''}
            </Spinner>}
      </PaginationLink>
    </PaginationItem>
  ));

  const handleCopy = () => {
    ReactGA.event({
      category: 'Model Save',
      action: 'Click',
      label: 'FRREDSS App',
    });
  };

  const toggleModal = () => setModal(!modal);

  const handleFormSubmitSuccess = () => {
    handleCopy();
    toggleModal();
  };

  const LOADING_PROGRESS = (props.yearlyResults.length / props.years.length) * 100;
  

  return (
    <>
      <div className='cardheader flex flex-col justify-between items-start'>
          <div className='text-white text-20p'>
            Forest Resource and Renewable Energy Decision Support System
            (FRREDSS)
          </div>
          <div className="flex items-center justify-between w-full mt-2">
            <div className='text-white text-36p'>Results</div>
            <div className="flex items-center justify-center gap-x-4">
              {props.saveUrl && (
                <div className="flex items-center justify-center gap-x-4">
                  {!linkCopied ? (
                    <button 
                      className="text-white hover:bg-gray-400 text-gray-800 text-12p font-bold py-2 px-2 rounded-lg flex items-center justify-center border-white border-2p w-200p"
                      onClick={toggleModal}
                    >
                      <div className="flex items-center justify-center gap-x-2">
                        <FontAwesomeIcon icon={faDownload} />
                        <span>Save Model Link</span>
                      </div>
                    </button>
                  ) : (
                    <button 
                      className="text-white hover:bg-gray-400 text-green-100 text-12p font-bold py-2 px-2 rounded-lg flex items-center justify-center border-white border-2p w-200p"
                    >
                      <div className="flex items-center justify-center gap-x-2">
                        <FontAwesomeIcon icon={faCheck} />
                        <span>Link Copied to Clipboard</span>
                      </div>
                    </button>
                  )}
                </div>
              )}
              {(LOADING_PROGRESS !== 100) && (
                <Spinner size="sm" color='light' className='mt-1 ml-1'>
                {''}
                </Spinner>
              )}
              <HomeButton 
                loading={LOADING_PROGRESS !== 100}
                tooltipText='Go To Home' 
                tooltipTarget='goToHomeButton'
              />
            </div>
          </div>
      </div>
      <div className='cardcontents'>
        <div className='years-pagination'>
          <Pagination aria-label='Year navigation' size='lg'>
            <PaginationItem
              className='years-page'
              active={props.years.length === props.selectedYearIndex}
            >
              <PaginationLink
                key={'all'}
                onClick={() => props.setSelectedYearIndex(props.years.length)}
              >
                All Results
              </PaginationLink>
            </PaginationItem>
            {pages}
          </Pagination>
        </div>
        <div className="my-1">
          <Progress
            value={LOADING_PROGRESS}
          />
        </div>
        {props.selectedYearIndex === props.years.length && (
          <AllResultsContainer {...props} />
        )}
        {props.selectedYearIndex > -1 &&
          props.selectedYearIndex < props.years.length && (
            <YearlyResultsContainer
              results={props.yearlyResults[props.selectedYearIndex]}
              teaInputs={props.teaInputs}
              teaModel={props.teaModel}
              biomassTarget={props.allYearResults.biomassTarget}
            />
          )}
      </div>
      <Modal isOpen={modal} toggle={toggleModal}>
          <UserDetails toggle={toggleModal} onSubmitSuccess={handleFormSubmitSuccess} saveUrl={props.saveUrl} />
      </Modal>
    </>
  );
};

import {
  InputModCHP,
  InputModGP,
  InputModGPO
} from '@ucdavis/tea/input.model';
import { OutputModSensitivity } from '@ucdavis/tea/output.model';
import {
  computeConstantLAC,
  computeCurrentLAC,
  computeEnergyRevenueRequiredPW
} from '@ucdavis/tea/utility';
import 'esri-leaflet-renderers';
import { Feature, FeatureCollection } from 'geojson';
import { LatLngBoundsExpression } from 'leaflet';
import { createRef, useEffect, useState } from 'react';
import { DynamicMapLayer, FeatureLayer } from 'react-esri-leaflet';
import ReactGA from 'react-ga4';
import {
  LayersControl,
  MapContainer,
  ScaleControl,
  TileLayer,
  useMapEvents,
} from 'react-leaflet';
import { Button, Pagination, PaginationItem, PaginationLink, Progress } from 'reactstrap';
import { InputModCHPClass } from '../../models/CHPClasses';
import { InputModGPClass } from '../../models/GPClasses';
import { InputModGPOClass } from '../../models/GPOClasses';
import {
  AllYearsResults,
  FrcsInputs,
  Geometry,
  MapCoordinates,
  RequestParams,
  RequestParamsAllYears,
  TechnoeconomicModels,
  TransportInputs,
  YearlyResult
} from '../../models/Types';

import {
  faExpandArrowsAlt,
  faEye,
  faEyeSlash,
  faMinusSquare
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useParams } from 'react-router-dom';
import { ATTRIBUTION, DEFAULT_TRANSMISSION_VAL, MAP_BOX_TILES, MAP_BOX_TILES_SATELLITE } from '../../../../Resources/Constants';
import Loader from '../../../../Shared/Loader';
import { trackEvent } from '../../../Utils/gaAnalytics';
import { InputContainer } from '../Inputs/InputContainer';
import { checkFrcsValidity, checkTeaValidity } from '../Inputs/validation';
import { ResultsContainer } from '../Results/ResultsContainer';
import { serviceUrl } from '../Shared/config';
import { convertGeoJSON } from '../Shared/util';
import { ClusterTransportationMoveInLayer } from './ClusterTransportationMoveInLayer';
import { ClusterTransportationRoutesLayer } from './ClusterTransportationRoutesLayer';
import { CustomMarker } from './CustomMarker';
import { ErrorGeoJsonLayers } from './ErrorGeoJsonLayers';
import { ExternalLayerLegend } from './ExternalLayerLegend';
import { ExternalLayerSelection } from './ExternalLayerSelection';
import { GeoJsonLayers } from './GeoJsonLayers';
import NominatimSearchControl from './NominatimSearchControl';
import { PrintControl } from './PrintControl';
import { SubstationLayer } from './Layers/SubstationLayer';


export interface RequestParamsAllYearsNoTransmission {
  facilityLat: number;
  facilityLng: number;
  teaModel: string;
  teaInputs: InputModGPO | InputModCHP | InputModGP;
}

const { BaseLayer } = LayersControl;

const MapClickHandler = ({ setBiomassCoordinates, setFacilityCoordinates, selectBiomassCoordinates, loading, yearlyResults }: any) => {
  useMapEvents({
    click(e: any) {
      if (!loading && yearlyResults.length === 0) {
        setBiomassCoordinates(e.latlng);

        if (selectBiomassCoordinates === false) {
          setFacilityCoordinates(e.latlng);
        }
      }
    }
  });

  return null;
};

const processDieselFuelPrice = (price: string | number): number => {
  if (typeof price === 'string') {
    const parsedValue = parseFloat(price.replace(/,/g, ''));
    if (!isNaN(parsedValue)) {
      return parsedValue;
    } else {
      console.error('Invalid diesel fuel price');
      return 0; 
    }
  }
  return price;
};

const getShortUrlData = async (modelID:string) => {
  const getUrlData = serviceUrl + `saved-model`;

  const originalUrl = await fetch(getUrlData + '/' + modelID, {
    mode: 'cors',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(res => (res.ok ? res.json() : ('')))

  if (!originalUrl) {
    throw new Error('Failed to retrieve original URL');
  }

  return originalUrl;
};

export const MapContainerComponent = () => {
  const { modelID } = useParams();
  const [isLoading, setIsLoading] = useState(!!modelID);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [mapLayerLoading, setMapLayerLoading] = useState<boolean>(false);
  const [mapReady, setMapReady] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [saveUrl, setSaveUrl] = useState<string>('');
  const [isClusterZone, setIsClusterZone] = useState(true);
  const [isErrorZone, setIsErrorZone] = useState(true);
  const [loading, toggleLoading] = useState<boolean>(false);
  const [hasProcessingError, setHasProcessingError] = useState<boolean>(false);
  const [allYearResults, setAllYearResults] = useState<AllYearsResults>();
  const [yearlyResults, setYearlyResults] = useState<YearlyResult[]>([]);
  const [
    sensitvityResults,
    setSensitivityResults
  ] = useState<OutputModSensitivity>();
  const [selectedYearIndex, setSelectedYearIndex] = useState<number>(-1);
  const [showResults, toggleShowResults] = useState<boolean>(false);
  const [expandedResults, toggleExpandedResults] = useState<boolean>(false);
  const [geoJsonResults, setGeoJsonResults] = useState<FeatureCollection[]>([]);
  const [geoJsonShapeResults, setGeoJsonShapeResults] = useState<
    FeatureCollection[]
  >([]);
  const [errorGeoJsonShapeResults, setErrorGeoJsonShapeResults] = useState<
    FeatureCollection[]
  >([]);
  const [tripGeometries, setTripGeometries] = useState<Geometry[]>([]);

  const [showGeoJson, toggleGeoJson] = useState<boolean>(true);
  const [showErrorGeoJson, toggleErrorGeoJson] = useState<boolean>(false);
  const [showMoveInGeoJson, toggleMoveInGeoJson] = useState<boolean>(false);
  const [
    showTransportationGeoJson,
    toggleTransportationGeoJson
  ] = useState<boolean>(false);

  const [zoom, setZoom] = useState<number>(9);
  const [center, setCenter] = useState<MapCoordinates>({
    lat: 37.87439641742907,
    lng: -120.47592259245009
  });
  const [bounds, setBounds] = useState<LatLngBoundsExpression>([
    [40.1, -122.5],
    [39.2, -120]
  ]);
  const [inputErrors, setInputError] = useState<string[]>([]);

  // external layers
  const [externalLayers, setExternalLayers] = useState<string[]>([]);

  const handleExternalLayerChange = (newLayers: string[]) => {
    setExternalLayers(newLayers);
    setMapLayerLoading(false);
  }

  const frcsInputsExample: FrcsInputs = {
    system: 'Ground-Based Mech WT',
    treatmentid: 3,
    dieselFuelPrice: 2.24,
    wageFaller: 42.19, // CA FallBuckWage May 2023
    wageOther: 22.07, // CA AllOthersWage May 2020
    laborBenefits: 38.4, // Assume a nationwide average of 38.4% for benefits and other payroll costs
    ppiCurrent: 145.62, // Nov 2024
    residueRecovFracWT: 80, // FRCS default 80%
    residueRecovFracCTL: 50 // FRCS default 50%
  };

  const transportInputsExample: TransportInputs = {
    wageTruckDriver: 25.23, // Hourly mean wage for tractor-trailer truck drivers Nov 2024
    driverBenefits: 25,
    oilCost: 0.641, // June 2022
    fullyLoadedRate: 0,
  };

  const [teaInputs, setTeaInputs] = useState<
    InputModGPO | InputModCHP | InputModGP
  >(new InputModGPOClass());
  const [teaModel, setTeaModel] = useState(
    TechnoeconomicModels.genericPowerOnly
  );

  const [frcsInputs, setFrcsInputs] = useState<FrcsInputs>(frcsInputsExample);

  const [transportInputs, setTransportInputs] = useState<TransportInputs>(
    transportInputsExample
  );

  const years: number[] = [];
  for (let index = 0; index < teaInputs.Financing.EconomicLife; index++) {
    years.push(2016 + index); // Note that the hardcoded 2016 is the first year
  }

  useEffect(() => {
    // when teaModel changes, change default values
    if (teaModel === TechnoeconomicModels.genericPowerOnly) {
      setTeaInputs(new InputModGPOClass());
    }
    if (teaModel === TechnoeconomicModels.genericCombinedHeatAndPower) {
      setTeaInputs(new InputModCHPClass());
    }
    if (teaModel === TechnoeconomicModels.gasificationPower) {
      setTeaInputs(new InputModGPClass());
    }
  }, [teaModel, inputErrors]);

  const [
    facilityCoordinates,
    setFacilityCoordinates
  ] = useState<MapCoordinates>({
    lat: 37.87439641742907,
    lng: -120.47592259245009
  });
  const [biomassCoordinates, setBiomassCoordinates] = useState<MapCoordinates>({
    lat: 37.87439641742907,
    lng: -120.47592259245009
  });

  const [
    selectBiomassCoordinates,
    setSelectBiomassCoordinates
  ] = useState<boolean>(false);

  const [expansionFactor, setExpansionFactor] = useState<number>(1);

  useEffect(() => {
    if (!selectBiomassCoordinates) {
      setBiomassCoordinates({ ...facilityCoordinates });
    }
  }, [selectBiomassCoordinates, facilityCoordinates]);

  let mapRef: any = createRef<typeof MapContainer>();

  const cleanTeaInput = (inputs: any) => {
    for (var key in inputs) {
      if (typeof inputs[key] === 'string') {
        inputs[key] = parseFloat(inputs[key].toString().replace(/\,/g, ''));

        if (isNaN(inputs[key])) {
          inputs[key] = inputs[key].toString();
        }
      } else if (typeof inputs[key] === 'object') {
        inputs[key] = cleanTeaInput(inputs[key]);
      }
    }

    return inputs;
  };

  const submitInputs = async () => {
    toggleLoading(true);

    trackEvent(
      'Model Run',
      'Click',
      'FRREDSS App',
    );

    frcsInputs.dieselFuelPrice = processDieselFuelPrice(frcsInputs.dieselFuelPrice)

    let teaInputsClone = { ...teaInputs };
    const cleanedInput = cleanTeaInput(teaInputsClone);
    setTeaInputs(cleanedInput);

    // validate frcs inputs
    const frcsErrors = await checkFrcsValidity(frcsInputs);

    if (frcsErrors.length > 0) {
      setInputError(frcsErrors);
      toggleLoading(false);
      return;
    }

    const teaErrors = await checkTeaValidity(teaModel, teaInputs);

    if (teaErrors.length > 0) {
      setInputError(teaErrors);
      toggleLoading(false);
      return;
    }

    setIsExpanded(!isExpanded);
    toggleExpandedResults(!expandedResults);
    setCenter(facilityCoordinates);
    setZoom(8);
    setBounds([
      [facilityCoordinates.lat + 1, facilityCoordinates.lng + 4],
      [facilityCoordinates.lat - 1, facilityCoordinates.lng + 1]
    ]);
    setInputError([]);

    const allYearInputs: RequestParamsAllYears = {
      facilityLat: facilityCoordinates.lat,
      facilityLng: facilityCoordinates.lng,
      transmission: DEFAULT_TRANSMISSION_VAL,
      teaModel: teaModel,
      teaInputs: teaInputs
    };

    let continueProcessing = true;

    const data = {
      allYearInputs: {
        facilityLat: facilityCoordinates.lat,
        facilityLng: facilityCoordinates.lng,
        transmission: DEFAULT_TRANSMISSION_VAL,
        teaModel: teaModel,
        teaInputs: teaInputs
      },
      biomassCoordinates,
      frcsInputs,
      transportInputs
    };

    const shortenUrl = await fetch(
      serviceUrl + `shorten-url`,
      {
        mode: 'cors',
        method: 'POST',
        body: JSON.stringify({ data }),
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    .then(res => (res.ok ? res.json() : ''))
    .catch(error => {
      console.error('Error:', error);
      return null;
    });

    if (shortenUrl && shortenUrl.shortUrl) {
        setSaveUrl(shortenUrl.shortUrl)
    } else {
        console.error('shortUrl is undefined or request failed');
    }

    const allYearResults: AllYearsResults = await fetch(
      serviceUrl + 'initialProcessing',
      {
        mode: 'cors',
        method: 'POST',
        body: JSON.stringify(allYearInputs),
        headers: {
          'Content-Type': 'application/json'
        }
      }
    ).then(res => (res.ok ? res.json() : (continueProcessing = false)));

    if (!continueProcessing) {
      setHasProcessingError(true);
      return;
    }

    allYearResults.facilityCoordinates = {
      lat: facilityCoordinates.lat,
      lng: facilityCoordinates.lng
    };

    allYearResults.biomassCoordinates = {
      lat: biomassCoordinates.lat,
      lng: biomassCoordinates.lng
    };

    setAllYearResults(allYearResults);
    setTeaInputs({ ...teaInputs });
    setSelectedYearIndex(years.length);

    let radius = 0;
    let clusterIds: string[] = [];
    let errorIds: string[] = [];
    let energyRevenueRequiredPresentYears: number[] = [];
    let cashFlows: any[] = [];
    let currentLAC = 0;
    let constantLAC = 0;
    let totalPresentWorth = 0;
    const generalInflation = teaInputs.EscalationInflation.GeneralInflation;
    for (let index = 0; index < years.length; index++) {
      let continueProcessingYear = true;
      const reqBody: RequestParams = {
        facilityLat: facilityCoordinates.lat,
        facilityLng: facilityCoordinates.lng,
        lat: biomassCoordinates.lat,
        lng: biomassCoordinates.lng,
        system: frcsInputs.system,
        treatmentid: frcsInputs.treatmentid,
        dieselFuelPrice:
          frcsInputs.dieselFuelPrice * (1 + generalInflation / 100) ** index,
        biomassTarget: allYearResults.biomassTarget, // green metric tons per year
        firstYear: years[0],
        year: years[index],
        clusterIds,
        errorIds,
        radius,
        teaModel: teaModel,
        annualGeneration: allYearResults.annualGeneration, // kWh
        moistureContent:
          allYearResults.teaInputs.ElectricalFuelBaseYear.MoistureContent,
        cashFlow: allYearResults.teaResults.AnnualCashFlows[index],
        costOfEquity: allYearResults.teaInputs.Financing.CostOfEquity,
        generalInflation: generalInflation,
        carbonCreditPrice: teaInputs.CarbonCredit.CreditPrice,
        energyEconomyRatio: teaInputs.CarbonCredit.EnergyEconomyRatio,
        includeCarbonCredit: teaInputs.IncludeCarbonCredit,
        wageFaller:
          frcsInputs.wageFaller * (1 + generalInflation / 100) ** index,
        wageOther: frcsInputs.wageOther * (1 + generalInflation / 100) ** index,
        laborBenefits: frcsInputs.laborBenefits,
        ppiCurrent:
          frcsInputs.ppiCurrent * (1 + generalInflation / 100) ** index,
        residueRecovFracWT: frcsInputs.residueRecovFracWT,
        residueRecovFracCTL: frcsInputs.residueRecovFracCTL,
        expansionFactor: expansionFactor,
        wageTruckDriver:
          transportInputs.wageTruckDriver *
          (1 + generalInflation / 100) ** index,
        driverBenefits: transportInputs.driverBenefits,
        oilCost:
          transportInputs.oilCost * (1 + generalInflation / 100) ** index,
        capitalCost: allYearResults.teaInputs.CapitalCost
      };
      const yearResult: YearlyResult = await fetch(serviceUrl + 'process', {
        mode: 'cors',
        method: 'POST',
        body: JSON.stringify(reqBody),
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(res => (res.ok ? res.json() : (continueProcessingYear = false)));

      if (!continueProcessingYear) {
        setHasProcessingError(true);
        return;
      }

      const energyRevenueRequiredPW = computeEnergyRevenueRequiredPW(
        index + 1,
        teaInputs.Financing.CostOfEquity,
        yearResult.cashFlow.EnergyRevenueRequired
      );
      totalPresentWorth += energyRevenueRequiredPW;
      currentLAC = computeCurrentLAC(
        allYearInputs.teaInputs.Financing.CostOfEquity,
        index + 1, // number of years
        totalPresentWorth,
        allYearResults.annualGeneration
      );
      yearResult.currentLCOE = currentLAC;
      constantLAC = computeConstantLAC(
        allYearInputs.teaInputs.Financing.CostOfEquity,
        allYearInputs.teaInputs.EscalationInflation.GeneralInflation,
        index + 1, // number of years
        totalPresentWorth,
        allYearResults.annualGeneration
      );
      yearResult.constantLCOE = constantLAC;

      radius = yearResult.radius;
      const uniqueClusters = yearResult.clusterNumbers.filter(
        (item, index) => yearResult.clusterNumbers.indexOf(item) === index
      );
      const uniqueErrors = yearResult.errorClusterNumbers.filter(
        (item, index) => yearResult.errorClusterNumbers.indexOf(item) === index
      );
      clusterIds.push(...uniqueClusters);
      errorIds.push(...uniqueErrors);
      cashFlows.push(yearResult.cashFlow);
      energyRevenueRequiredPresentYears.push(energyRevenueRequiredPW);
      const geoJsonClusters: Feature[] = convertGeoJSON(yearResult.clusters);
      setGeoJsonResults(results => [
        ...results,
        {
          type: 'FeatureCollection',
          features: geoJsonClusters
        }
      ]);
      setGeoJsonShapeResults(results => [...results, yearResult.geoJson]);
      setErrorGeoJsonShapeResults(results => [
        ...results,
        yearResult.errorGeoJson
      ]);
      setTripGeometries(results => [
        ...results,
        yearResult.tripGeometries[0] // for now we are assuming only one trip route per year
      ]);

      setYearlyResults(results => [...results, yearResult]);
      toggleLoading(false);
      toggleShowResults(true);
      // TODO: update each year cashflow as it is done
    }
    allYearResults.teaResults.AnnualCashFlows = cashFlows;
    allYearResults.teaResults.CurrentLAC.CurrentLACofEnergy = currentLAC;
    allYearResults.teaResults.CurrentLAC.TotalPresentWorth = totalPresentWorth;
    allYearResults.teaResults.CurrentLAC.PresentWorth = energyRevenueRequiredPresentYears;
    allYearResults.teaResults.ConstantLAC.ConstantLACofEnergy = constantLAC;
    setAllYearResults(allYearResults);
  };

  const style = {
    height: window.innerHeight
  };

  const allResultsSelected = selectedYearIndex === years.length;

  useEffect(() => {
    const fetchOriginalUrl = async () => {
      if (modelID && !hasLoaded) {
        try {
          setIsLoading(true);
          const result = await getShortUrlData(modelID);
          
          setTeaModel(result.allYearInputs.teaModel);
          setTeaInputs(result.allYearInputs.teaInputs);
          setFacilityCoordinates({
            lat: result.allYearInputs.facilityLat,
            lng: result.allYearInputs.facilityLng
          });
          setBiomassCoordinates(result.biomassCoordinates);
          setFrcsInputs(result.frcsInputs);
          setTransportInputs(result.transportInputs);
        } catch (error) {
          console.error('Error fetching original URL:', error);
        } finally {
          setIsLoading(false);
          setHasLoaded(true);
        }
      }
    };

    fetchOriginalUrl();
  }, [modelID]);

  useEffect(() => {
    setMapReady(true);
  }, []); 

  useEffect(() => {
    const handleBeforeUnload = (event: { preventDefault: () => void; returnValue: string; }) => {
      if (loading) {
        event.preventDefault();
        event.returnValue = "Your model is still running. Are you sure you want to leave?";
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [loading]);

  const mapLayerHandler = {
      loading: () => setMapLayerLoading(true),
      load: () => setMapLayerLoading(false)
    }

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div style={style}>
      {mapLayerLoading && (
        <Progress
          animated
          style={{
            height: '5px'
          }}
          color="success"
          value="100"
        />
      )}
      {(yearlyResults.length > 0 || loading) && (
        <div className='toggle-buttons flex flex-col items-center justify-center gap-y-6'>
          <Button
            onClick={() => {
              toggleMoveInGeoJson(h => !h);
            }}
            active={showMoveInGeoJson}
            disabled={allResultsSelected}
            title='Show Move-In Geometry in selected year'
            color='primary'
            className='flex items-center justify-between gap-x-2 w-full px-2'
          >
            <span>{!showMoveInGeoJson ? 'Show Move In' : 'Hide Move In'}</span>
            <FontAwesomeIcon icon={showMoveInGeoJson ? faEye : faEyeSlash} />
          </Button>
          <Button
            onClick={() => {
              toggleTransportationGeoJson(h => !h);
            }}
            active={showTransportationGeoJson}
            disabled={allResultsSelected}
            title='Show Transportation Geometry in selected year'
            color='primary'
            className='flex items-center justify-between gap-x-2 w-full px-2'
          >
            <span>
              {!showTransportationGeoJson
                ? 'Show Transportation'
                : 'Hide Transportation'}
            </span>
            <FontAwesomeIcon
              icon={showTransportationGeoJson ? faEye : faEyeSlash}
            />
          </Button>
          <Button
            onClick={() => {
              setIsErrorZone(!isErrorZone);
              toggleErrorGeoJson(!showErrorGeoJson);
            }}
            active={showErrorGeoJson}
            title='Cluster zones which cannot be used for biomass'
            color='primary'
            className='flex items-center justify-between gap-x-2 w-full px-2'
          >
            <span>{isErrorZone ? 'Show Unusable Zones' : 'Hide Unusable Zones'}</span>
            <FontAwesomeIcon icon={isErrorZone ? faEye : faEyeSlash} />
          </Button>
          <Button
            onClick={() => {
              setIsClusterZone(!isClusterZone);
              toggleGeoJson(!showGeoJson);
            }}
            active={showGeoJson}
            color='primary'
            className='flex items-center justify-between gap-x-2 w-full px-2'
          >
            <span>
              {isClusterZone ? 'Hide Cluster Zones' : 'Show Cluster Zones'}
            </span>
            <FontAwesomeIcon icon={isClusterZone ? faEyeSlash : faEye} />
          </Button>
          <Button
            className='flex items-center justify-between gap-x-2 w-full px-2'
            color='primary'
            onClick={() => {
              setIsExpanded(!isExpanded);
              toggleExpandedResults(!expandedResults);
            }}
          >
            <span>{isExpanded ? 'Expand Results' : 'Minimize Results'} </span>
            <FontAwesomeIcon
              icon={isExpanded ? faExpandArrowsAlt : faMinusSquare}
            />
          </Button>
          <div className='toggle-input-result'>
            <Pagination aria-label='Page navigation example' size='lg'>
              <PaginationItem active={!showResults}>
                <PaginationLink
                  key='inputs'
                  onClick={() => toggleShowResults(false)}
                >
                  Inputs
                </PaginationLink>
              </PaginationItem>
              <PaginationItem active={showResults}>
                <PaginationLink
                  key='finalResults'
                  onClick={() => toggleShowResults(true)}
                >
                  Results
                </PaginationLink>
              </PaginationItem>
            </Pagination>
          </div>
        </div>
      )}
      <div className='layers-container'>
        <ExternalLayerSelection onChange={handleExternalLayerChange} />
        <ExternalLayerLegend layers={externalLayers} />
      </div>
      <div
        className={expandedResults ? 'expanded-results' : 'sidebar'}
        id='sidebar'
      >
        {hasProcessingError && (
          <div className='alert alert-danger'>
            There was a problem processing your results. This is most likely due
            to an inability to find enough biomass to satisfy your requirements
            within a reasonable radius, but could also be due to API performance
            or availability issues. Please refresh the page and try again.
          </div>
        )}
        {!showResults && (
          <InputContainer
            facilityCoordinates={facilityCoordinates}
            setFacilityCoordinates={setFacilityCoordinates}
            biomassCoordinates={biomassCoordinates}
            setBiomassCoordinates={setBiomassCoordinates}
            selectBiomassCoordinates={selectBiomassCoordinates}
            setSelectBiomassCoordinates={setSelectBiomassCoordinates}
            expansionFactor={expansionFactor}
            setExpansionFactor={setExpansionFactor}
            frcsInputs={frcsInputs}
            setFrcsInputs={setFrcsInputs}
            teaInputs={teaInputs}
            setTransportInputs={setTransportInputs}
            transportInputs={transportInputs}
            setTeaInputs={setTeaInputs}
            teaModel={teaModel}
            setTeaModel={setTeaModel}
            submitInputs={() => submitInputs()}
            loading={loading}
            disabled={yearlyResults.length > 0 || loading}
            errors={inputErrors}
          />
        )}
        {showResults && !!allYearResults && (
          <ResultsContainer
            toggleShowResults={toggleShowResults}
            showResults={showResults}
            loading={loading}
            allYearResults={allYearResults}
            yearlyResults={yearlyResults}
            years={years}
            selectedYearIndex={selectedYearIndex}
            setSelectedYearIndex={setSelectedYearIndex}
            showGeoJson={showGeoJson}
            toggleGeoJson={toggleGeoJson}
            showErrorGeoJson={showErrorGeoJson}
            toggleErrorGeoJson={toggleErrorGeoJson}
            teaInputs={teaInputs}
            teaModel={teaModel}
            frcsInputs={frcsInputs}
            sensitivityResults={sensitvityResults}
            expansionFactor={expansionFactor}
            saveUrl={saveUrl}
          />
        )}
      </div>
      <MapContainer
        ref={mapRef}
        bounds={bounds}
        zoom={zoom}
        center={center}
        style={{ height: '100%', width: '100%' }}
      >
        <MapClickHandler
          setBiomassCoordinates={setBiomassCoordinates}
          setFacilityCoordinates={setFacilityCoordinates}
          selectBiomassCoordinates={selectBiomassCoordinates}
          loading={loading}
          yearlyResults={yearlyResults}
        />
        <ScaleControl />
        <LayersControl position='bottomleft'>
          <BaseLayer checked name='Outdoors'>
            <TileLayer attribution={ATTRIBUTION} url={MAP_BOX_TILES} />
          </BaseLayer>
          <BaseLayer name='Satellite'>
            <TileLayer attribution={ATTRIBUTION} url={MAP_BOX_TILES_SATELLITE} />
          </BaseLayer>
        </LayersControl>
        <TileLayer attribution={ATTRIBUTION} url={MAP_BOX_TILES} />
        <NominatimSearchControl setFacilityCoordinates={setFacilityCoordinates} />
        <PrintControl />
        {externalLayers.includes('transmission') && (
          <FeatureLayer
            url={
              'https://services3.arcgis.com/bWPjFyq029ChCGur/arcgis/rest/services/Transmission_Line/FeatureServer/2'
            }
            eventHandlers={mapLayerHandler}
          />
        )}
        {externalLayers.includes('substation') && (
          <SubstationLayer mapLayerHandler={mapLayerHandler} />
        )}
        {externalLayers.includes('plant') && (
          <FeatureLayer
            url={
              'https://services3.arcgis.com/bWPjFyq029ChCGur/ArcGIS/rest/services/Power_Plant/FeatureServer/0'
            }
            eventHandlers={mapLayerHandler}
          />
        )}
        {externalLayers.includes('county') && (
          <FeatureLayer
            url={
              'https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/California_County_Boundaries/FeatureServer/0'
            }
            eventHandlers={mapLayerHandler}
          />
        )}
        {externalLayers.includes('urbanCities') && (
          <FeatureLayer
            url={
              'https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/USA_Urban_Areas/FeatureServer/3'
            }
            eventHandlers={mapLayerHandler}
          />
        )}
        {externalLayers.includes('airDistricts') && (
          <FeatureLayer
            url={
              'https://services.arcgis.com/jDGuO8tYggdCCnUJ/ArcGIS/rest/services/California_Air_Districts/FeatureServer/0'
            }
            eventHandlers={mapLayerHandler}
          />
        )}
        {externalLayers.includes('ownership') && (
          <DynamicMapLayer
            url={
              'https://egis.fire.ca.gov/arcgis/rest/services/FRAP/ownership/MapServer'
            }
            eventHandlers={mapLayerHandler}
          />
        )}
        {externalLayers.includes('fire') && (
          <FeatureLayer
            url={
              'https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/ArcGIS/rest/services/FHSZ_SRA_LRA_Combined/FeatureServer/0'
            }
            opacity={0.7}
            eventHandlers={mapLayerHandler}
          />
        )}
        {externalLayers.includes('dataBoundary') && (
          <FeatureLayer
            url={
              'https://services9.arcgis.com/mt4kvYhNXSa5AqLG/ArcGIS/rest/services/FL_Sierra/FeatureServer/0'
            }
            eventHandlers={mapLayerHandler}
          />
        )}
        {externalLayers.includes('feedstockBiomassCompetition') && (
          <FeatureLayer
            url={
              'https://services9.arcgis.com/mt4kvYhNXSa5AqLG/arcgis/rest/services/Task_5_Basic_Feedstock_Competition/FeatureServer/1'
            }
            eventHandlers={mapLayerHandler}
          />
        )}
        {externalLayers.includes('feedstockWoodProcessingCompetition') && (
          <FeatureLayer
            url={
              'https://services9.arcgis.com/mt4kvYhNXSa5AqLG/arcgis/rest/services/Task_5_Basic_Feedstock_Competition/FeatureServer/0'
            }
          />
        )}
        {yearlyResults.length > 0 && (
          <>
            {showMoveInGeoJson && (
              <ClusterTransportationMoveInLayer
                facilityCoordinates={facilityCoordinates}
                years={years}
                yearlyResults={yearlyResults}
                selectedYearIndex={selectedYearIndex}
              />
            )}
            {showGeoJson && (
              <GeoJsonLayers
                years={years}
                yearlyGeoJson={geoJsonShapeResults}
                selectedYearIndex={selectedYearIndex}
              />
            )}
            
            {showTransportationGeoJson && (
              <ClusterTransportationRoutesLayer
                facilityCoordinates={facilityCoordinates}
                years={years}
                yearlyResults={yearlyResults}
                selectedYearIndex={selectedYearIndex}
              />
            )}
            {showErrorGeoJson && (
              <ErrorGeoJsonLayers
                years={years}
                yearlyGeoJson={errorGeoJsonShapeResults}
                selectedYearIndex={selectedYearIndex}
              />
            )}
          </>
        )}

        <CustomMarker icon='facility' position={facilityCoordinates} />
        {selectBiomassCoordinates &&
          biomassCoordinates.lat !== facilityCoordinates.lat &&
          biomassCoordinates.lng !== facilityCoordinates.lng && (
            <CustomMarker icon='biomass' position={biomassCoordinates} />
          )}
      </MapContainer>
    </div>
  );
};

export const MapContainerWrapper = () => {

  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: '/pages/model', title: 'Model Page' });
  }, []);

  return (
    <MapContainerComponent />
  )
};  

import { FrcsOutputs } from '@ucdavis/frcs/out/model';
import { LcaInputs, LcaOutputs } from '@ucdavis/lca/model';
import { InputModCHP, InputModGP, InputModGPO } from '@ucdavis/tea/input.model';
import {
  CashFlow,
  CashFlowCHP,
  CashFlowGP,
  OutputModCHP,
  OutputModGP,
  OutputModGPO
} from '@ucdavis/tea/output.model';
import { Feature } from 'geojson';

export interface RequestParams {
  facilityLat: number;
  facilityLng: number;
  lat: number;
  lng: number;
  system: string;
  treatmentid: number;
  dieselFuelPrice: number; // $/gal
  biomassTarget: number;
  firstYear: number;
  year: number;
  clusterIds: string[];
  errorIds: string[];
  radius: number;
  teaModel: string;
  annualGeneration: number; // used for LCA, kWh
  moistureContent: number; // for frcs
  cashFlow: CashFlow | CashFlowCHP | CashFlowGP;
  costOfEquity: number;
  generalInflation: number;
  carbonCreditPrice: number;
  energyEconomyRatio: number;
  includeCarbonCredit: boolean;
  wageFaller: number;
  wageOther: number;
  laborBenefits: number;
  ppiCurrent: number;
  residueRecovFracWT: number;
  residueRecovFracCTL: number;
  expansionFactor: number;
  wageTruckDriver: number;
  driverBenefits: number;
  oilCost: number;
  capitalCost: number;
}

export interface FrcsInputs {
  system: string;
  treatmentid: number;
  dieselFuelPrice: number;
  wageFaller: number;
  wageOther: number;
  laborBenefits: number;
  ppiCurrent: number;
  residueRecovFracWT: number;
  residueRecovFracCTL: number;
}

export interface TransportInputs {
  wageTruckDriver: number;
  driverBenefits: number;
  oilCost: number;
  fullyLoadedRate: number;
}

export const TechnoeconomicModels = {
  genericPowerOnly: 'GPO',
  genericCombinedHeatAndPower: 'CHP',
  gasificationPower: 'GP',
  hydrogen: 'Hydrogen'
};

export interface LCAresults extends LcaOutputs {
  inputs: LcaInputs;
}

export interface Treatment {
  id: number;
  name: string;
  description: string;
}

export const Treatments: Treatment[] = [
  {
    id: 1,
    name: 'RMI100',
    description: 'Remove all live and dead trees.'
  },
  {
    id: 2,
    name: 'SDI30',
    description:
      'Stand Density Index (SDI) targeted treatment, aims to reduce the SDI of stands to a targeted portion of the maximum SDI for the stand. SDI30 targets a final SDI of 30% of the maximum SDI.'
  },
  {
    id: 3,
    name: 'SDI55',
    description:
      'Stand Density Index (SDI) targeted treatment, aims to reduce the SDI of stands to a targeted portion of the maximum SDI for the stand. SDI55 targets a final SDI of 55% of the maximum SDI.'
  },
  {
    id: 4,
    name: 'TFA_20',
    description:
      '20% reduction in basal area, thinning from above (the largest trees are removed first)'
  },
  {
    id: 5,
    name: 'TFA_40',
    description:
      '40% reduction in basal area, thinning from above (the largest trees are removed first)'
  },
  {
    id: 6,
    name: 'TFA_60',
    description:
      '60% reduction in basal area, thinning from above (the largest trees are removed first)'
  },
  {
    id: 7,
    name: 'TFA_80',
    description:
      '80% reduction in basal area, thinning from above (the largest trees are removed first)'
  },
  {
    id: 8,
    name: 'TFB_20',
    description:
      '20% reduction in basal area, thinning from below (the smallest trees are removed first)'
  },
  {
    id: 9,
    name: 'TFB_40',
    description:
      '40% reduction in basal area, thinning from below (the smallest trees are removed first)'
  },
  {
    id: 10,
    name: 'TFB_60',
    description:
      '60% reduction in basal area, thinning from below (the smallest trees are removed first)'
  },
  {
    id: 11,
    name: 'TFB_80',
    description:
      '80% reduction in basal area, thinning from below (the smallest trees are removed first)'
  }
];

export interface Geometry {
  coordinates: number[][];
  type: string;
}

export interface Results {
  clusterIds: string[];
  errorIds: string[];
  years: YearlyResult[];
  radius: number;
}

export interface YearlyResult {
  tripGeometries: Geometry[];
  year: number;
  lcaResults: LCAresults;
  totalArea: number;
  totalFeedstock: number; // total biomass from frcs residue output
  totalDryFeedstock: number; // feedstock multipled by (1-moistureContent)
  totalHarvestCost: number; // cost of harvesting residue biomass from frcs
  totalCoproduct: number; // Frcs.Total - Frcs.Residue weight
  totalDryCoproduct: number;
  totalCoproductCost: number;
  totalMoveInCost: number; // move in cost from separate frcs function
  totalMoveInDistance: number;
  totalTransportationCost: number; // transportation cost per gt * cluster biomass (distance from osrm)
  harvestCostPerDryTon: number;
  transportationCostPerDryTon: number;
  moveInCostPerDryTon: number;
  feedstockCostPerTon: number;
  numberOfClusters: number;
  clusterNumbers: string[];
  clusters: ClusterResult[];
  errorClusters: ClusterErrorResult[];
  errorClusterNumbers: string[];
  radius: number;
  fuelCost: number;
  cashFlow: CashFlow;
  geoJson: any;
  errorGeoJson: any;
  currentLCOE: number;
  constantLCOE: number;
}
export interface ClusterResult {
  cluster_no: string;
  biomass: number;
  combinedCost: number;
  area: number;
  distance: number;
  residueCost: number;
  transportationCost: number;
  frcsResult: FrcsOutputs;
  center_lat: number;
  center_lng: number;
  landing_lat: number;
  landing_lng: number;
  landing_distance: number;
  county: string;
  land_use: string;
  site_class: number;
  forest_type: string;
  haz_class: number;
  // total live biomass (including saw log)
  // total dead biomass
  // tons of biomass
  // 2, 7, 15, 25, 35, 40
  // vol of merch timber
  // land_use
  // slope, elevation, site_class, forest_type
  // county
}

export interface ClusterErrorResult {
  cluster_no: string;
  biomass: number;
  area: number;
  error: string;
  slope: number;
}

export interface ErrorClusterFeature extends Feature {
  properties: ClusterErrorResult;
}

export interface ClusterFeature extends Feature {
  properties: ClusterResult;
}

export interface MapCoordinates {
  lat: number;
  lng: number;
}

export interface RequestParamsAllYears {
  facilityLat: number;
  facilityLng: number;
  transmission: any; // InputModTransimission;
  teaModel: string;
  teaInputs: InputModGPO | InputModCHP | InputModGP; // | InputModHydrogen;
}

export interface AllYearsResults {
  biomassTarget: number; // from tea output
  annualGeneration: number;
  teaResults: OutputModGPO | OutputModCHP | OutputModGP;
  teaInputs: InputModGPO | InputModCHP | InputModGP;
  transmissionResults: any;
  nearestSubstation: string;
  facilityCoordinates: MapCoordinates;
  biomassCoordinates: MapCoordinates;
  distanceToNearestSubstation: number; // km
}

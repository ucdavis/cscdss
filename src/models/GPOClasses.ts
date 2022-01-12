import {
  InputModGPO,
  ElectricalFuelBaseYearInputModGPO,
  ExpensesBaseYearInputModGPO
} from '@ucdavis/tea/input.model';
import {
  ExpensesBaseYearModGPO,
  IncomeOtherThanEnergyMod,
  ElectricalFuelBaseYearMod
} from '@ucdavis/tea/output.model';
import {
  TaxesInputModClass,
  FinancingInputModClass,
  IncomeOtherThanEnergyInputModClass,
  EscalationInflationInputModClass,
  CarbonCreditClass
} from './TEASharedClasses';

export class InputModGPOClass implements InputModGPO {
  CapitalCost = 100_000_000;
  CapitalCostManuallySet = false;
  ElectricalFuelBaseYear = new ElectricalFuelBaseYearInputModGPOClass();
  ExpensesBaseYear = new ExpensesBaseYearInputModGPOClass();
  Taxes = new TaxesInputModClass();
  Financing = new FinancingInputModClass();
  IncomeOtherThanEnergy = new IncomeOtherThanEnergyInputModClass();
  EscalationInflation = new EscalationInflationInputModClass();
  TaxCreditFrac = [1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  CarbonCredit = new CarbonCreditClass();
  IncludeCarbonCredit = false;
  FirstYear = 2016;
}

export class ElectricalFuelBaseYearInputModGPOClass
  implements ElectricalFuelBaseYearInputModGPO {
  NetElectricalCapacity = 25000;
  CapacityFactor = 85;
  MoistureContent = 50;
  NetStationEfficiency = 20;
  FuelHeatingValue = 18608;
  FuelAshConcentration = 5;
}

export class ExpensesBaseYearInputModGPOClass
  implements ExpensesBaseYearInputModGPO {
  BiomassFuelCost = 22.05;
  LaborCost = 3_000_000;
  MaintenanceCost = 2_000_000;
  InsurancePropertyTax = 2_000_000;
  Utilities = 300_000;
  AshDisposal = 150_000;
  Management = 300_000;
  OtherOperatingExpenses = 600_000;
}

export class ExpensesBaseYearModGPOClass implements ExpensesBaseYearModGPO {
  TotalNonFuelExpenses = 0;
  TotalExpensesIncludingFuel = 0;
  LaborCostKwh = 0;
  MaintenanceCostKwh = 0;
  InsurancePropertyTaxKwh = 0;
  UtilitiesKwh = 0;
  ManagementKwh = 0;
  OtherOperatingExpensesKwh = 0;
  TotalNonFuelExpensesKwh = 0;
  TotalExpensesIncludingFuelKwh = 0;
  FuelCostKwh = 0;
  AshDisposalKwh = 0;
}

export class IncomeOtherThanEnergyModClass implements IncomeOtherThanEnergyMod {
  AnnualCapacityPayment = 0;
  AnnualDebtReserveInterest = 0;
}

export class ElectricalFuelBaseYearModGPOClass
  implements ElectricalFuelBaseYearMod {
  AnnualHours = 0;
  BiomassTarget = 0;
}

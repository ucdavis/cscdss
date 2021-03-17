import React from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import * as fs from 'fs';

import {
  AllYearsResults,
  FrcsInputs,
  Treatments,
  YearlyResult
} from '../../models/Types';
import { Button } from 'reactstrap';
import { formatCurrency, formatNumber } from '../Shared/util';
import { NUM_YEARS_TO_RUN } from '../Shared/config';

interface Props {
  allYearResults: AllYearsResults;
  yearlyResults: YearlyResult[];
  sensitivityChart: React.MutableRefObject<any>;
  frcsInputs: FrcsInputs;
  teaInputs: any;
  teaModel: string;
}

export const ResultsExport = (props: Props) => {
  // don't show export until all years are done running
  if (!props.yearlyResults || props.yearlyResults.length < NUM_YEARS_TO_RUN) {
    return <></>;
  }

  const treatmentIndex = Treatments.findIndex(
    x => x.id === props.frcsInputs.treatmentid
  );
  const treatmentName = Treatments[treatmentIndex].name;

  const capitalCost = formatCurrency(
    props.teaModel === 'GP'
      ? props.teaInputs.CapitalCost.GasifierSystemCapitalCost
      : props.teaInputs.CapitalCost
  );

  const makeExcel = async () => {
    console.log(props.yearlyResults);
    // https://github.com/exceljs/exceljs#interface
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('ExcelJS sheet');

    // This part increases the width of a chosen column
    const nameCol = worksheet.getColumn('B');
    nameCol.width = 38;

    worksheet.addTable({
      name: 'TechPerf',
      ref: 'B2',
      headerRow: true,
      totalsRow: false,
      columns: [{ name: 'Technical Performance' }, { name: ' ' }],
      rows: [
        ['Project Prescription', treatmentName],
        ['Facility Type', props.teaModel],
        ['Capital Cost ($)', capitalCost],
        [
          'Net Electrical Capacity (kWe)',
          props.allYearResults.teaInputs.ElectricalFuelBaseYear
            .NetElectricalCapacity
        ],
        [
          'Net Station Efficiency (%)',
          props.teaInputs.ElectricalFuelBaseYear.NetStationEfficiency
        ],
        [
          'Economic Life (y)',
          props.allYearResults.teaInputs.Financing.EconomicLife
        ],
        [
          'Proximity to substation (km)',
          props.allYearResults.distanceToNearestSubstation
        ]
      ]
    });

    worksheet.addTable({
      name: 'supply',
      ref: 'B13',
      headerRow: true,
      totalsRow: false,
      columns: [
        { name: 'Resource Supply (ton)' },
        { name: 'Total' },
        ...props.yearlyResults.map(r => ({ name: 'Y' + r.year }))
      ],
      rows: [
        [
          'Feedstock ',
          props.yearlyResults.reduce((sum, x) => sum + x.totalFeedstock, 0),
          ...props.yearlyResults.map(r => r.totalFeedstock)
        ],
        [
          'Coproduct',
          props.yearlyResults.reduce((sum, x) => sum + x.totalCoproduct, 0),
          ...props.yearlyResults.map(r => r.totalCoproduct)
        ]
      ]
    });

    worksheet.addTable({
      name: 'analysis',
      ref: 'B17',
      headerRow: true,
      totalsRow: false,
      columns: [
        { name: 'Environmental Analysis' },
        { name: 'Unit' },
        { name: 'Total' },
        ...props.yearlyResults.map(r => ({ name: 'Y' + r.year }))
      ],
      rows: [
        [
          'Diesel',
          'mGal',
          formatNumber(
            props.yearlyResults.reduce(
              (sum, year) => sum + year.lcaResults.inputs.diesel,
              0
            ) * 1000
          ),
          ...props.yearlyResults.map(year =>
            formatNumber(year.lcaResults.inputs.diesel * 1000)
          )
        ],
        [
          'Gasoline',
          'mGal',
          formatNumber(
            props.yearlyResults.reduce(
              (sum, year) => sum + year.lcaResults.inputs.gasoline,
              0
            ) * 1000
          ),
          ...props.yearlyResults.map(year =>
            formatNumber(year.lcaResults.inputs.gasoline * 1000)
          )
        ],
        [
          'Jet Fuel',
          'mGal',
          formatNumber(
            props.yearlyResults.reduce(
              (sum, year) => sum + year.lcaResults.inputs.jetfuel,
              0
            ) * 1000
          ),
          ...props.yearlyResults.map(year =>
            formatNumber(year.lcaResults.inputs.jetfuel * 1000)
          )
        ],
        [
          'Transport Distance',
          'm',
          formatNumber(
            props.yearlyResults.reduce(
              (sum, year) => sum + year.lcaResults.inputs.distance,
              0
            ) * 1000
          ),
          ...props.yearlyResults.map(year =>
            formatNumber(year.lcaResults.inputs.distance * 1000)
          )
        ]
      ]
    });

    worksheet.addTable({
      name: 'lci',
      ref: 'B23',
      headerRow: true,
      totalsRow: false,
      columns: [
        { name: 'LCI Results' },
        { name: 'Unit' },
        { name: 'Total' },
        ...props.yearlyResults.map(r => ({ name: 'Y' + r.year }))
      ],
      rows: [
        [
          'CO2',
          'kg',
          formatNumber(
            props.yearlyResults.reduce(
              (sum, year) => sum + year.lcaResults.lciResults.CO2,
              0
            )
          ),
          ...props.yearlyResults.map(r =>
            formatNumber(r.lcaResults.lciResults.CO2)
          )
        ],
        [
          'CH4',
          'g',
          formatNumber(
            props.yearlyResults.reduce(
              (sum, year) => sum + year.lcaResults.lciResults.CH4,
              0
            )
          ),
          ...props.yearlyResults.map(r =>
            formatNumber(r.lcaResults.lciResults.CH4)
          )
        ],
        [
          'N2O',
          'g',
          formatNumber(
            props.yearlyResults.reduce(
              (sum, year) => sum + year.lcaResults.lciResults.N2O,
              0
            )
          ),
          ...props.yearlyResults.map(r =>
            formatNumber(r.lcaResults.lciResults.N2O)
          )
        ],
        [
          'CO2e',
          'kg',
          formatNumber(
            props.yearlyResults.reduce(
              (sum, year) => sum + year.lcaResults.lciResults.CO2e,
              0
            )
          ),
          ...props.yearlyResults.map(r =>
            formatNumber(r.lcaResults.lciResults.CO2e)
          )
        ],
        [
          'CO',
          'g',
          formatNumber(
            props.yearlyResults.reduce(
              (sum, year) => sum + year.lcaResults.lciResults.CO,
              0
            ) * 1000
          ),
          ...props.yearlyResults.map(r =>
            formatNumber(r.lcaResults.lciResults.CO * 1000)
          )
        ],
        [
          'NOx',
          'g',
          formatNumber(
            props.yearlyResults.reduce(
              (sum, year) => sum + year.lcaResults.lciResults.NOx,
              0
            )
          ),
          ...props.yearlyResults.map(r =>
            formatNumber(r.lcaResults.lciResults.NOx)
          )
        ],
        [
          'NH3',
          'mg',
          formatNumber(
            props.yearlyResults.reduce(
              (sum, year) => sum + year.lcaResults.lciResults.NH3,
              0
            ) * 1000
          ),
          ...props.yearlyResults.map(r =>
            formatNumber(r.lcaResults.lciResults.NH3 * 1000)
          )
        ],
        [
          'PM10',
          'mg',
          formatNumber(
            props.yearlyResults.reduce(
              (sum, year) => sum + year.lcaResults.lciResults.PM10,
              0
            ) * 1000
          ),
          ...props.yearlyResults.map(r =>
            formatNumber(r.lcaResults.lciResults.PM10 * 1000)
          )
        ],
        [
          'PM2.5',
          'mg',
          formatNumber(
            props.yearlyResults.reduce(
              (sum, year) => sum + year.lcaResults.lciResults.PM25,
              0
            ) * 1000
          ),
          ...props.yearlyResults.map(r =>
            formatNumber(r.lcaResults.lciResults.PM25 * 1000)
          )
        ],
        [
          'SO2',
          'g',
          formatNumber(
            props.yearlyResults.reduce(
              (sum, year) => sum + year.lcaResults.lciResults.SO2,
              0
            )
          ),
          ...props.yearlyResults.map(r =>
            formatNumber(r.lcaResults.lciResults.SO2)
          )
        ],
        [
          'SOx',
          'mg',
          formatNumber(
            props.yearlyResults.reduce(
              (sum, year) => sum + year.lcaResults.lciResults.SOx,
              0
            ) * 1000
          ),
          ...props.yearlyResults.map(r =>
            formatNumber(r.lcaResults.lciResults.SOx * 1000)
          )
        ],
        [
          'VOCs',
          'mg',
          formatNumber(
            props.yearlyResults.reduce(
              (sum, year) => sum + year.lcaResults.lciResults.VOCs,
              0
            ) * 1000
          ),
          ...props.yearlyResults.map(r =>
            formatNumber(r.lcaResults.lciResults.VOCs * 1000)
          )
        ],
        [
          'Carbon Intensity',
          'kg CO2e',
          formatNumber(
            props.yearlyResults.reduce(
              (sum, year) => sum + year.lcaResults.lciResults.CO2e,
              0
            )
          ),
          ...props.yearlyResults.map(r =>
            formatNumber(r.lcaResults.lciResults.CO2e)
          )
        ]
      ]
    });

    worksheet.addTable({
      name: 'lcia',
      ref: 'B38',
      headerRow: true,
      totalsRow: false,
      columns: [
        { name: 'LCIA Results' },
        { name: 'Unit' },
        { name: 'Total' },
        ...props.yearlyResults.map(r => ({ name: 'Y' + r.year }))
      ],
      rows: [
        [
          'Global Warming Air',
          'kg CO2 eq',
          formatNumber(
            props.yearlyResults.reduce(
              (sum, year) =>
                sum + year.lcaResults.lciaResults.global_warming_air,
              0
            )
          ),
          ...props.yearlyResults.map(r =>
            formatNumber(r.lcaResults.lciaResults.global_warming_air)
          )
        ],
        [
          'Acidification Air',
          'g SO2 eq',
          formatNumber(
            props.yearlyResults.reduce(
              (sum, year) =>
                sum + year.lcaResults.lciaResults.acidification_air,
              0
            ) * 1000
          ),
          ...props.yearlyResults.map(r =>
            formatNumber(r.lcaResults.lciaResults.acidification_air * 1000)
          )
        ],
        [
          'HH Particulate Air',
          'g PM2.5 eq',
          formatNumber(
            props.yearlyResults.reduce(
              (sum, year) =>
                sum + year.lcaResults.lciaResults.hh_particulate_air,
              0
            ) * 1000
          ),
          ...props.yearlyResults.map(r =>
            formatNumber(r.lcaResults.lciaResults.hh_particulate_air * 1000)
          )
        ],
        [
          'Euthrophication Air',
          'g N eq',
          formatNumber(
            props.yearlyResults.reduce(
              (sum, year) =>
                sum + year.lcaResults.lciaResults.eutrophication_air,
              0
            ) * 1000
          ),
          ...props.yearlyResults.map(r =>
            formatNumber(r.lcaResults.lciaResults.eutrophication_air * 1000)
          )
        ],
        [
          'Euthrophication Water',
          'g N eq',
          formatNumber(
            props.yearlyResults.reduce(
              (sum, year) =>
                sum + year.lcaResults.lciaResults.eutrophication_water,
              0
            ) * 1000
          ),
          ...props.yearlyResults.map(r =>
            formatNumber(r.lcaResults.lciaResults.eutrophication_water * 1000)
          )
        ],
        [
          'Smog Air',
          'kg O3 eq',
          formatNumber(
            props.yearlyResults.reduce(
              (sum, year) => sum + year.lcaResults.lciaResults.smog_air,
              0
            )
          ),
          ...props.yearlyResults.map(r =>
            formatNumber(r.lcaResults.lciaResults.smog_air)
          )
        ]
      ]
    });

    worksheet.addTable({
      name: 'technoeconomic',
      ref: 'B46',
      headerRow: true,
      totalsRow: false,
      columns: [
        { name: 'Technoeconomic Analysis' },
        { name: 'Unit' },
        { name: 'Total' },
        ...props.yearlyResults.map(r => ({ name: 'Y' + r.year }))
      ],
      rows: [
        [
          'Harvest Cost',
          '$/ton',
          formatCurrency(
            props.yearlyResults.reduce(
              (sum, year) => sum + year.totalFeedstockCost,
              0
            ) /
              props.yearlyResults.reduce(
                (sum, year) => sum + year.totalFeedstock,
                0
              )
          ),
          ...props.yearlyResults.map(r =>
            formatCurrency(r.totalFeedstockCost / r.totalFeedstock)
          )
        ],
        [
          'Transport Cost',
          '$/ton',
          formatCurrency(
            props.yearlyResults.reduce(
              (sum, year) => sum + year.totalTransportationCost,
              0
            ) /
              props.yearlyResults.reduce(
                (sum, year) => sum + year.totalFeedstock,
                0
              )
          ),
          ...props.yearlyResults.map(r =>
            formatCurrency(r.totalTransportationCost / r.totalFeedstock)
          )
        ],
        [
          'Move-in Cost',
          '$/ton',
          formatCurrency(
            props.yearlyResults.reduce(
              (sum, year) => sum + year.totalMoveInCost,
              0
            ) /
              props.yearlyResults.reduce(
                (sum, year) => sum + year.totalFeedstock,
                0
              )
          ),
          ...props.yearlyResults.map(r =>
            formatCurrency(r.totalMoveInCost / r.totalFeedstock)
          )
        ],
        [
          'Feedstock Cost',
          '$/ton',
          formatCurrency(
            props.yearlyResults.reduce((sum, year) => sum + year.fuelCost, 0) /
              props.yearlyResults.length
          ),
          ...props.yearlyResults.map(r => formatCurrency(r.fuelCost))
        ],
        [
          'Equity Recovery',
          '$',
          formatCurrency(
            props.yearlyResults.reduce(
              (sum, year) => sum + year.cashFlow.EquityRecovery,
              0
            )
          ),
          ...props.yearlyResults.map(r =>
            formatCurrency(r.cashFlow.EquityRecovery)
          )
        ],
        [
          'Equity Interest',
          '$',
          formatCurrency(
            props.yearlyResults.reduce(
              (sum, year) => sum + year.cashFlow.EquityInterest,
              0
            )
          ),
          ...props.yearlyResults.map(r =>
            formatCurrency(r.cashFlow.EquityInterest)
          )
        ],
        [
          'Equity Principal Paid',
          '$',
          formatCurrency(
            props.yearlyResults.reduce(
              (sum, year) => sum + year.cashFlow.EquityPrincipalPaid,
              0
            )
          ),
          ...props.yearlyResults.map(r =>
            formatCurrency(r.cashFlow.EquityPrincipalPaid)
          )
        ],
        [
          'Equity Principal Remaining',
          '$',
          formatCurrency(
            props.yearlyResults.reduce(
              (sum, year) => sum + year.cashFlow.EquityPrincipalRemaining,
              0
            )
          ),
          ...props.yearlyResults.map(r =>
            formatCurrency(r.cashFlow.EquityPrincipalRemaining)
          )
        ],
        [
          'Debt Recovery',
          '$',
          formatCurrency(
            props.yearlyResults.reduce(
              (sum, year) => sum + year.cashFlow.DebtRecovery,
              0
            )
          ),
          ...props.yearlyResults.map(r =>
            formatCurrency(r.cashFlow.DebtRecovery)
          )
        ],
        [
          'Debt Interest',
          '$',
          formatCurrency(
            props.yearlyResults.reduce(
              (sum, year) => sum + year.cashFlow.DebtInterest,
              0
            )
          ),
          ...props.yearlyResults.map(r =>
            formatCurrency(r.cashFlow.DebtInterest)
          )
        ],
        [
          'Debt Principal Paid',
          '$',
          formatCurrency(
            props.yearlyResults.reduce(
              (sum, year) => sum + year.cashFlow.DebtPrincipalPaid,
              0
            )
          ),
          ...props.yearlyResults.map(r =>
            formatCurrency(r.cashFlow.DebtPrincipalPaid)
          )
        ],
        [
          'Debt Principal Remaining',
          '$',
          formatCurrency(
            props.yearlyResults.reduce(
              (sum, year) => sum + year.cashFlow.DebtPrincipalRemaining,
              0
            )
          ),
          ...props.yearlyResults.map(r =>
            formatCurrency(r.cashFlow.DebtPrincipalRemaining)
          )
        ],
        [
          'Non-fuel Expenses',
          '$',
          formatCurrency(
            props.yearlyResults.reduce(
              (sum, year) => sum + year.cashFlow.NonFuelExpenses,
              0
            )
          ),
          ...props.yearlyResults.map(r =>
            formatCurrency(r.cashFlow.NonFuelExpenses)
          )
        ],
        [
          'Debt Reserve',
          '$',
          formatCurrency(
            props.yearlyResults.reduce(
              (sum, year) => sum + year.cashFlow.DebtReserve,
              0
            )
          ),
          ...props.yearlyResults.map(r =>
            formatCurrency(r.cashFlow.DebtReserve)
          )
        ],
        [
          'Deprecation',
          '$',
          formatCurrency(
            props.yearlyResults.reduce(
              (sum, year) => sum + year.cashFlow.Depreciation,
              0
            )
          ),
          ...props.yearlyResults.map(r =>
            formatCurrency(r.cashFlow.Depreciation)
          )
        ],
        [
          'Income--Capacity',
          '$',
          formatCurrency(
            props.yearlyResults.reduce(
              (sum, year) => sum + year.cashFlow.IncomeCapacity,
              0
            )
          ),
          ...props.yearlyResults.map(r =>
            formatCurrency(r.cashFlow.IncomeCapacity)
          )
        ],
        [
          'Interest on Debt Reserve',
          '$',
          formatCurrency(
            props.yearlyResults.reduce(
              (sum, year) => sum + year.cashFlow.InterestOnDebtReserve,
              0
            )
          ),
          ...props.yearlyResults.map(r =>
            formatCurrency(r.cashFlow.InterestOnDebtReserve)
          )
        ],
        [
          'Taxes w/o credit',
          '$',
          formatCurrency(
            props.yearlyResults.reduce(
              (sum, year) => sum + year.cashFlow.TaxesWoCredit,
              0
            )
          ),
          ...props.yearlyResults.map(r =>
            formatCurrency(r.cashFlow.TaxesWoCredit)
          )
        ],
        [
          'Tax Credit',
          '$',
          formatCurrency(
            props.yearlyResults.reduce(
              (sum, year) => sum + year.cashFlow.TaxCredit,
              0
            )
          ),
          ...props.yearlyResults.map(r => formatCurrency(r.cashFlow.TaxCredit))
        ],
        [
          'Taxes',
          '$',
          formatCurrency(
            props.yearlyResults.reduce(
              (sum, year) => sum + year.cashFlow.Taxes,
              0
            )
          ),
          ...props.yearlyResults.map(r => formatCurrency(r.cashFlow.Taxes))
        ],
        [
          'Energy Revenue Required',
          '$',
          formatCurrency(
            props.yearlyResults.reduce(
              (sum, year) => sum + year.cashFlow.EnergyRevenueRequired,
              0
            )
          ),
          ...props.yearlyResults.map(r =>
            formatCurrency(r.cashFlow.EnergyRevenueRequired)
          )
        ],
        [
          'Energy Revenue Required (PW)',
          '$',
          formatCurrency(
            props.allYearResults.teaResults.CurrentLAC.PresentWorth.reduce(
              (sum, x) => sum + x,
              0
            )
          ),
          ...props.allYearResults.teaResults.CurrentLAC.PresentWorth.map(r =>
            formatCurrency(r)
          )
        ]
      ]
    });

    worksheet.addTable({
      name: 'lcoe',
      ref: 'B70',
      headerRow: true,
      totalsRow: false,
      columns: [{ name: 'LCOE' }, { name: 'Result' }],
      rows: [
        [
          'Current $ LCOE',
          formatNumber(
            props.allYearResults.teaResults.CurrentLAC.CurrentLACofEnergy,
            4
          )
        ],
        [
          'Constant $ LCOE',
          formatNumber(
            props.allYearResults.teaResults.ConstantLAC.ConstantLACofEnergy,
            4
          )
        ]
      ]
    });

    worksheet.addTable({
      name: 'assumptions',
      ref: 'B108',
      headerRow: true,
      totalsRow: false,
      columns: [{ name: 'Assumptions' }, { name: 'Total' }],
      rows: [
        ['LogLength, ft', 32],
        ['LoadWeight, green tons (logs)', 25],
        ['LoadWeight, green tons (chips)', 25],
        ['CTLTrailSpacing, ft', 50],
        ['HardwoodCostPremium, fraction', 0.2],
        ['ResidueRecoveryFraction for WT systems', 0.8],
        ['ResidueRecoveryFraction for CTL', 0.5],
        ['HardwoodFractionCT', 0.2],
        ['HardwoodFractionSLT', 0],
        ['HardwoodFractionLLT', 0],
        ['Feller/Bucker wage (2019)', 30.96],
        ['All Others wage (2019)', 22.26],
        ['Benefits and other payroll costs', '35%'],
        ['OIL_ETC_COST ($/mile)', 0.35],
        ['DRIVERS_PER_TRUCK', 1.67],
        ['MILES_PER_GALLON', 6],
        ['FUEL_COST ($/gallon)', 3.251],
        ['TRUCK_LABOR ($/hr)', 23.29]
      ]
    });

    worksheet.addTable({
      name: 'keyReferences',
      ref: 'B128',
      headerRow: true,
      totalsRow: false,
      columns: [{ name: 'Key References' }],
      rows: [
        ['Fuel Reduction Cost Simulator'],
        ['Advanced Hardwood Biofuels Northwest'],
        ['California Biomass Collaborative'],
        ['EPA eGrid'],
        ['GREET model'],
        ['Literature for emission factors']
      ]
    });

    worksheet.addTable({
      name: 'disclaimer',
      ref: 'B136',
      headerRow: true,
      totalsRow: false,
      columns: [{ name: 'Disclaimer' }],
      rows: [
        [
          'Results are estimates only and no guarantees are made that actual project performance will match, and they do not necessarily reflect the views and policies of the California Energy Commission.'
        ]
      ]
    });

    // turn the chart into an image and embed it
    if (props.sensitivityChart) {
      // we should always have the chart but if it's null for some reason skip it instead of breaking
      const chartSvg = props.sensitivityChart.current.container.children[0];

      // TODO: legend isn't in SVG so it currently isn't included
      const pngData = await svgToPng(chartSvg, 800, 600);

      // add image to workbook by base64
      const chartImageId2 = workbook.addImage({
        base64: pngData,
        extension: 'png'
      });

      const myBase64Image = 'data:image/png;base64,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';
      const legendImageId = workbook.addImage({
        base64: myBase64Image,
        extension: 'png'
      });

      // insert an image over B2:D6
      worksheet.addImage(chartImageId2, 'B75:J100');
      worksheet.addImage(legendImageId, 'B103:J106');
    }

    const workbookBuffer = await workbook.xlsx.writeBuffer();

    // send file to client
    saveAs(
      new Blob([workbookBuffer], { type: 'application/octet-stream' }),
      `cecdata.xlsx`
    );
  };

  return (
    <p>
      <Button color='primary' onClick={makeExcel}>
        Export results to Excel
      </Button>
    </p>
  );
};

const svgToPng = (svg: any, width: number, height: number) => {
  return new Promise<string>((resolve, reject) => {
    let canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) throw Error('No canvas context found');

    // Set background to white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    let xml = new XMLSerializer().serializeToString(svg);
    let dataUrl = 'data:image/svg+xml;utf8,' + encodeURIComponent(xml);
    let img = new Image(width, height);

    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      let imageData = canvas.toDataURL('image/png', 1.0);
      resolve(imageData);
    };

    img.onerror = () => reject();

    img.src = dataUrl;
  });
};

export default ResultsExport;

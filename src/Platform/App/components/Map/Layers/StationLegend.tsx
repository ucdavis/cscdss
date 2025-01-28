export const StationLegend = () => (
  <div className='esriLegendService' style={{ display: 'block' }}>
    <table width='95%'>
      <tbody>
        <tr>
          <td align='left'>
            <span className='esriLegendServiceLabel'>
              Substation - California Electric Substations
            </span>
          </td>
        </tr>
      </tbody>
    </table>
    <div style={{ display: 'block' }}>
      <table width='95%' className='esriLegendLayerLabel'>
        <tbody>
          <tr>
            <td align='left' />
          </tr>
        </tbody>
      </table>
      <table
        cellPadding={0}
        cellSpacing={0}
        width='95%'
        className='esriLegendLayer'
      >
        <tbody>
          <tr>
            <td width={35} align='center'>
              <div style={{ width: '30px', height: '30px' }}>
                <svg
                  overflow='hidden'
                  width={30}
                  height={30}
                  style={{ touchAction: 'none' }}
                >
                  <circle
                    cx="15"
                    cy="15"
                    r="6"
                    fill="#3388ff"
                    fillOpacity="0.7"
                    stroke="#3388ff"
                    strokeWidth="1"
                  />
                </svg>
              </div>
            </td>
            <td>
              <table width='95%'>
                <tbody>
                  <tr>
                    <td align='left'>Electric Substations</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);
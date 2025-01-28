import { Feature, FeatureCollection, Point } from 'geojson';
import { useEffect, useState } from 'react';
import { CircleMarker, Popup } from 'react-leaflet';

interface SubstationLayerProps {
  mapLayerHandler: {
    loading: () => void;
    load: () => void;
  };
}

export const SubstationLayer = ({ mapLayerHandler }: SubstationLayerProps) => {
  const [data, setData] = useState<FeatureCollection | null>(null);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        mapLayerHandler.loading();
        const url = 'https://raw.githubusercontent.com/aunshx/wesad-ml/main/ca_substations.geojson';
        const response = await fetch(url);
        const json = await response.json();
        setData(json);
        mapLayerHandler.load(); 
      } catch (err) {
        console.error('Error loading data:', err);
        mapLayerHandler.load();
      }
    };

    loadData();
  }, [mapLayerHandler]);

  if (!data) return null;

  return (
    <>
      {data.features.map((feature: Feature) => {
        if (feature.geometry.type === 'Point') {
          const coordinates = (feature.geometry as Point).coordinates;
          return (
            <CircleMarker
              key={feature.properties?.id || Math.random()}
              center={[coordinates[1], coordinates[0]]}
              radius={6}
              pathOptions={{
                color: '#3388ff',
                fillColor: '#3388ff',
                fillOpacity: 0.7,
                weight: 1
              }}
            >
              <Popup>
                {feature.properties && Object.entries(feature.properties).map(([key, value]) => (
                  <div key={key}>
                    <strong>{key}:</strong> {String(value)}
                    <br />
                  </div>
                ))}
              </Popup>
            </CircleMarker>
          );
        }
        return null;
      })}
    </>
  );
};
import * as React from "react";
import * as mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "./CompanyMap.scss";

type Props = {
  lng: number;
  lat: number;
};

export default class CompanyMap extends React.Component<Props> {
  componentDidMount() {
    if (this.mapboxglSupported()) {
      this.initMap();
    }
  }

  addEtablissementMarker(map: mapboxgl.Map) {
    new mapboxgl.Marker()
      .setLngLat(this.getLngLat())
      .setPopup(new mapboxgl.Popup({ closeButton: true }))
      .addTo(map);
  }

  initMap() {
    fetch("/mapbox/style.json")
      .then(response => response.json())
      .then(style => {
        const mapOptions: mapboxgl.MapboxOptions = {
          container: "map",
          style,
          center: this.getLngLat(),
          zoom: 13
        };
        const map = new mapboxgl.Map(mapOptions);
        this.addEtablissementMarker(map);
      });
  }

  getLngLat() {
    return { lng: this.props.lng, lat: this.props.lat };
  }

  mapboxglSupported() {
    return mapboxgl.supported();
  }

  render() {
    if (this.mapboxglSupported()) {
      return <div id="map"></div>;
    } else {
      return (
        <div className="box" style={{ flex: 1 }}>
          Votre navigateur ne supporte pas WebGL et ne peut afficher la carte de
          l'établissement
        </div>
      );
    }
  }
}

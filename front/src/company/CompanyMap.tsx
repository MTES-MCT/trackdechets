import React from "react";
import mapboxgl from "mapbox-gl";
import axios from "axios";
import "./CompanyMap.scss";

type Props = {
  lng: number;
  lat: number;
};

export default class CompanyMap extends React.Component<Props> {
  constructor(props: Props) {
    super(props);
  }

  componentDidMount() {
    axios.get("/mapbox/style.json").then(response => {
      const style = response.data;
      const mapOptions: mapboxgl.MapboxOptions = {
        container: "map",
        style,
        center: this.getLngLat(),
        zoom: 13
      };
      let map = new mapboxgl.Map(mapOptions);
      this.addEtablissementMarker(map);
    });
  }

  addEtablissementMarker(map: mapboxgl.Map) {
    new mapboxgl.Marker()
      .setLngLat(this.getLngLat())
      .setPopup(new mapboxgl.Popup({ closeButton: true }))
      .addTo(map);
  }

  getLngLat() {
    return { lng: this.props.lng, lat: this.props.lat };
  }

  render() {
    return <div id="map"></div>;
  }
}

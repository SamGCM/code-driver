import mapboxgl from 'mapbox-gl';
import { getColorById } from './getColorById';
import {bikeIcon} from '../assets/bike-icon.ts';
import { mapMarkerIcon } from '../assets/marker-icon.ts';

export class Route {
  public currentMarker: mapboxgl.Marker;
  public endMarker: mapboxgl.Marker;
  private map: any;
  private routeLayerId: string;
  private color: string;

  constructor(map: mapboxgl.Map, options: { currentMarkerOptions: any; endMarkerOptions: any; routeId: string; color: string; }) {
    const { currentMarkerOptions, endMarkerOptions } = options;
    this.map = map;
    this.color = options.color;
    this.routeLayerId = `route-${options.routeId}`;

    const currentMarkerElement = document.createElement('div');
    currentMarkerElement.innerHTML = bikeIcon;
    currentMarkerElement.style.fontSize = '36px';
    currentMarkerElement.style.color = this.color;

    this.currentMarker = new mapboxgl.Marker({ element: currentMarkerElement })
      .setLngLat(currentMarkerOptions?.lngLat!)
      .addTo(this.map);

    const endMarkerElement = document.createElement('div');
    endMarkerElement.innerHTML = mapMarkerIcon
    endMarkerElement.style.fontSize = '100px';
    endMarkerElement.style.color = this.color;

    this.endMarker = new mapboxgl.Marker({ element: endMarkerElement })
      .setLngLat(endMarkerOptions.lngLat!)
      .addTo(this.map);

    this.calculateRoute();

    this.currentMarker.on('dragend', () => this.calculateRoute());
    this.endMarker.on('dragend', () => this.calculateRoute());
  }

  private async calculateRoute() {
    const currentPosition = this.currentMarker.getLngLat();
    const endPosition = this.endMarker.getLngLat();

    const query = await fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${currentPosition.lng},${currentPosition.lat};${endPosition.lng},${endPosition.lat}?geometries=geojson&access_token=${mapboxgl.accessToken}`);
    const json = await query.json();
    const data = json.routes[0];

    if (this.map.getLayer(this.routeLayerId)) {
      this.map.removeLayer(this.routeLayerId);
      this.map.removeSource(this.routeLayerId);
    }

    this.map.addLayer({
      id: this.routeLayerId,
      type: 'line',
      source: {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: data.geometry,
        }
      },
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': this.color,
        'line-width': 5,
        'line-opacity': 0.75,
      }
    });
  }

  public updateCurrentMarkerPosition(lngLat: [number, number]) {
    this.currentMarker.setLngLat(lngLat);
    this.calculateRoute();
  }

  delete() {
    this.currentMarker.remove();
    this.endMarker.remove();
    if (this.map.getLayer(this.routeLayerId)) {
      this.map.removeLayer(this.routeLayerId);
      this.map.removeSource(this.routeLayerId);
    }
  }
}

export class Map {
  public map: mapboxgl.Map;
  private routes: { [id: string]: Route } = {};

  constructor(element: any, options: any) {
    this.map = new mapboxgl.Map({
      ...options,
      container: element,
    });

    this.map.addControl(new mapboxgl.NavigationControl());
    this.map.addControl(
      new mapboxgl.GeolocateControl({
          positionOptions: {
              enableHighAccuracy: true
          },
          trackUserLocation: true,
          showUserHeading: true
      })
  );
  }

  addRoute(id: string, routeOptions: { currentMarkerOptions: any; endMarkerOptions: any; routeId: string}) {
    const color = getColorById(id);
    
    const route = new Route(this.map, {
      ...routeOptions,
      routeId: id,
      color,
    });
    this.routes[id] = route;
  }
  

  updateMarkStart(id: string, lngLat: [number, number]) {
    this.routes[id].updateCurrentMarkerPosition(lngLat);
  }

  removeRoute(id: string) {
    if (this.routes[id]) {
      this.routes[id].delete();
      delete this.routes[id];
    }
  }

  getRoute(id: string): Route | undefined {
    return this.routes[id];
  }
}
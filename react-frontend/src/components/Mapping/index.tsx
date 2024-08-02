import {
  FormEvent,
  FunctionComponent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Route } from "../../util/models";
import { Map } from "../../util/map";
import { useSnackbar } from "notistack";
import io from "socket.io-client";
import { Button, Grid, MenuItem, Select } from "@mui/material";
import { Navbar } from "../Navbar";
import { RouteExistsError } from "../../errors/route-exists.error";
import mapboxgl from 'mapbox-gl'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_API_KEY;

export const Mapping: FunctionComponent = () => {
  const API_URL = import.meta.env.VITE_API_URL as string;
  const [routes, setRoutes] = useState<any[]>([]);
  const [routeIdSelected, setRouteIdSelected] = useState<string>("");
  const socketIORef = useRef<any>();
  const { enqueueSnackbar } = useSnackbar();
  const [disableSubmit, setDisabledSubmit] = useState<boolean>(false);
  
  const lng = -47.92923;
  const lat = -15.82594;
  const zoom = 14;

  const mapContainer: any = useRef(null);
  const mapRef: any = useRef(null);
  const mapOptions = {
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [lng, lat],
    zoom: zoom
  }
  
  const finishRoute = useCallback(
    (route: Route) => {
      enqueueSnackbar(`${route.title} finalizou!`, {
        variant: "success",
      });
      mapRef.current?.removeRoute(route._id);
    },
    [enqueueSnackbar]
  );

  useEffect(() => {
    if (mapRef.current) return;
    mapRef.current = new Map(mapContainer.current, mapOptions);
  });

  useEffect(() => {
    if(!mapContainer.current) return;

    if (!socketIORef.current?.connected) {
      socketIORef.current = io(API_URL);
      socketIORef.current.on("connect", () => console.info("web socket connected"));
    }

    const handler = (data: {
      routeId: string;
      position: [number, number];
      finished: boolean;
    }) => {

      mapRef.current?.updateMarkStart(data.routeId, [data.position[0], data.position[1]]);
      
      const route = routes.find((route) => route._id === data.routeId) as Route;
      if (data.finished) {
        finishRoute(route);
      }
    };
    socketIORef.current?.on("new-position", handler);
    return () => {
      socketIORef.current?.off("new-position", handler);
    };
  }, [mapContainer.current]);
  
  useEffect(() => {
    if (routeIdSelected) {
      const route = routes.find((route) => route._id === routeIdSelected);
      mapRef.current?.map.setCenter([route.startPosition.lng, route.startPosition.lat]);

      if(mapRef.current?.getRoute(routeIdSelected)) {
        return;
      }

      mapRef.current?.addRoute(routeIdSelected, {
        currentMarkerOptions: {
          lngLat: [route.startPosition.lng, route.startPosition.lat],
        },
        endMarkerOptions: {
          lngLat: [route.endPosition.lng, route.endPosition.lat],
        }
      });
    }

  }, [finishRoute, routes, routeIdSelected]);

  useEffect(() => {

    fetch(`${API_URL}/routes`)
      .then((data) => data.json())
      .then((data) => setRoutes(data));
  }, []);

  const startRoute = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      const route = routes.find((route) => route._id === routeIdSelected);
      
      try {
        socketIORef.current?.emit("new-direction", {
          routeId: routeIdSelected,
        });
      } catch (error) {
        if (error instanceof RouteExistsError) {
          enqueueSnackbar(`${route?.title} já adicionado, espere finalizar.`, {
            variant: "error",
          });
          return;
        }
        throw error;
      }
    },
    [routeIdSelected, routes, enqueueSnackbar]
  );

  return (
    <Grid className="root" container>
      <Grid item xs={12} sm={3}>
        <Navbar />
        <form 
          onSubmit={startRoute} 
          className="form"
        >
          <Select
            fullWidth
            displayEmpty
            value={routeIdSelected}
            onChange={(event) => setRouteIdSelected(event.target.value + "")}
          >
            <MenuItem value="">
              <em>Selecione uma corrida</em>
            </MenuItem>
            {routes.map((route, key) => (
              <MenuItem key={key} value={route._id}>
                {route.title}
              </MenuItem>
            ))}
          </Select>
          <div className="btnSubmitWrapper">
            <Button disabled={disableSubmit} type="submit" color="primary" variant="contained">
              Iniciar uma corrida
            </Button>
          </div>
        </form>
      </Grid>
      <Grid item xs={12} sm={9}>
        <div ref={mapContainer} className="map-container map" />
      </Grid>
    </Grid>
  );
};

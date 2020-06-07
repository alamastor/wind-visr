/*
 * Component containing various visualizations of data on world map.
 */
import React, {useState, useRef, useEffect} from 'react';
import {bindActionCreators} from 'redux';
import {Dispatch, connect} from 'react-redux';
import {style} from 'typestyle';
import moment from 'moment';
import Loadable from 'react-loadable';

import {getCycle, getData, getMaxWindSpeed} from '../../utils/fielddata';
import {
  State as FieldDataState,
  tauToDt,
  tauAvailable,
} from './fieldDataReducer';
import {RootState, RootAction as Action} from '../../reducers';
import MouseManager from '../../components/MouseManager';
import BackgroundMap from '../../components/BackgroundMap';
import WindRenderer from '../../components/WindRenderer';
import {
  moveMap,
  setCursorData,
  resetCursorData,
  setTau,
  setZoomLevel,
} from './actions';
import {setWindData, addData} from './fieldDataActions';
import Spinner from '../../components/Spinner';
import {setGlUnavailable} from '../App/actions';
import {Tau} from './reducer';
import {WindData} from '../../../rust_pkg';

const TAU_INTERVAL = 3; // Hours between taus
const TAU_STEP_INTERVAL = 500; // Milliseconds to wait before stepping to next tau

// Async load the Vector renderer, as by default it's not displayed
const loadingComponent = (props: {pastDelay: boolean}) =>
  props.pastDelay ? <Spinner color="white" /> : null;
const VectorRenderer = Loadable({
  loader: () =>
    import(
      /* webpackChunkName: "vectorRenderer" */ '../../components/VectorRenderer'
    ),
  loading: loadingComponent,
});

const mapStateToProps = (state: RootState) => ({
  displayParticles: state.mapVis.displayParticles,
  displayVectors: state.mapVis.displayVectors,
  displaySpeeds: true,
  paused: state.mapVis.paused,
  zoomLevel: state.mapVis.zoomLevel,
  centerLon: state.mapVis.centerLon,
  centerLat: state.mapVis.centerLat,
  fieldData: state.fieldData,
  tau: state.mapVis.tau,
});

const mapDispatchToProps = (dispatch: Dispatch<Action>) =>
  bindActionCreators(
    {
      setCursorData,
      resetCursorData,
      moveMap,
      setZoomLevel,
      setWindData,
      addData,
      setGlUnavailable,
      setTau,
    },
    dispatch,
  );

interface MapVisProps {
  width: number;
  height: number;
  zoomLevel: number;
  centerLat: number;
  centerLon: number;
  displayParticles: boolean;
  displayVectors: boolean;
  displaySpeeds: boolean;
  paused: boolean;
  fieldData: FieldDataState;
  tau: Tau;
  setCursorData: typeof setCursorData;
  resetCursorData: typeof resetCursorData;
  setZoomLevel: typeof setZoomLevel;
  setWindData: typeof setWindData;
  addData: typeof addData;
  setGlUnavailable: typeof setGlUnavailable;
  setTau: typeof setTau;
  moveMap: typeof moveMap;
}
const MapVis = React.memo(
  ({
    width,
    height,
    zoomLevel,
    centerLat,
    centerLon,
    displayParticles,
    displayVectors,
    displaySpeeds,
    paused,
    fieldData,
    tau,
    setCursorData,
    resetCursorData,
    moveMap,
    setZoomLevel,
    setWindData,
    addData,
    setGlUnavailable,
    setTau,
  }: MapVisProps) => {
    const refreshParticlesNextRenderRef = useRef(false);
    const [waitingToSetTau, setWaitingToSetTau] = useState(true);
    const projState = {
      mapDims: {
        width: width,
        height: height,
      },
      zoomLevel: zoomLevel,
      centerCoord: {
        lon: centerLon,
        lat: centerLat,
      },
    };
    const tausToFetchRef = useRef(
      [...Array(61).keys()].map((x: number) => 180 - 3 * x),
    ); // Queue of times fetch data for
    const prevStepTimeRef = useRef(new Date());
    const setWaitingToStepTimeoutIdRef = useRef<number | null>(null); // Id for setTimeout called with setNextTau
    const stepRemainingTimeRef = useRef<number | null>(null); // time remaining in paused step

    // Fetch data
    useEffect(() => {
      const getFieldData = async () => {
        return WindData.new(
          (await getCycle()).format(),
          await getMaxWindSpeed(),
        );
      };
      if (fieldData.windData == null) {
        getFieldData().then(setWindData);
      } else {
        const cyc = moment(fieldData.windData.cycle());
        if (cyc != null) {
          const tau = tausToFetchRef.current.pop();
          if (tau != null) {
            getData(cyc, tau).then((data: {u: number[]; v: number[]}) => {
              addData(tau, data);
            });
          }
        } else {
          throw new Error('Invalid cycle value: ' + fieldData.windData.cycle());
        }
      }
    }, [fieldData, addData, setWindData]);

    useEffect(() => {
      /*
       * Step to the next tau value and setup callback for subsequent step.
       */
      const stepTau = () => {
        setWaitingToSetTau(true);
      };

      if (paused) {
        if (setWaitingToStepTimeoutIdRef.current != null) {
          clearTimeout(setWaitingToStepTimeoutIdRef.current);
          setWaitingToSetTau(false);
          setWaitingToStepTimeoutIdRef.current = null;
          stepRemainingTimeRef.current =
            TAU_STEP_INTERVAL -
            (Date.now() - prevStepTimeRef.current.getTime());
        }
      } else {
        stepRemainingTimeRef.current = 0;
        if (!waitingToSetTau && setWaitingToStepTimeoutIdRef.current == null) {
          setWaitingToStepTimeoutIdRef.current = window.setTimeout(
            stepTau,
            stepRemainingTimeRef.current || TAU_STEP_INTERVAL,
          );
        }
      }
    }, [waitingToSetTau, paused, fieldData]);

    useEffect(() => {
      if (waitingToSetTau) {
        const nextTau = (tau ? tau.value + TAU_INTERVAL : 0) % 180;
        if (tauAvailable(fieldData, nextTau)) {
          setTau({
            value: nextTau,
            setAt: moment(),
          });
          setWaitingToSetTau(false);
          setWaitingToStepTimeoutIdRef.current = null;
        }
      }
    }, [waitingToSetTau, fieldData, tau, setTau]);

    // Render
    const currentDataDt = tau ? tauToDt(fieldData, tau.value) : null;
    if (
      fieldData.windData != null &&
      currentDataDt != null &&
      tau != null &&
      tauAvailable(fieldData, tau.value)
    ) {
      const refreshParticles = refreshParticlesNextRenderRef.current;
      refreshParticlesNextRenderRef.current = false;
      return (
        <div
          id="map-vis"
          className={style({
            position: 'absolute',
            gridArea: '1 / 1 / -1 / -1',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          })}
        >
          {displaySpeeds ? (
            <WindRenderer
              windData={fieldData.windData}
              tau={tau.value}
              projState={projState}
              width={width}
              height={height}
              resetParticlesOnInit={refreshParticles}
              frameRate={50}
              displayParticles={displayParticles}
              setGlUnavailable={setGlUnavailable}
            />
          ) : null}
          <BackgroundMap projState={projState} />
          <div
            className={style({
              position: 'absolute',
              top: '0',
              left: '0',
              color: 'white',
              padding: '10px',
            })}
          >
            {currentDataDt.tz('UTC').format('HH:mm UTC DD/MM/YYYY')}
          </div>
        </div>
      );
    } else {
      return <Spinner color="white" />;
    }
  },
  (prevProps, nextProps) => {
    // For perf reasons don't update when only frame rate changes
    return !propsChanged(prevProps, nextProps, ['frameRate']);
  },
);
MapVis.displayName = 'MapVis';

/**
 * Check if any props changed, ignoring any props in the
 * ignore array. Used by shouldComponentUpdate to avoid
 * updates for some prop changes.
 */
function propsChanged(
  prevProps: MapVisProps,
  nextProps: MapVisProps,
  ignore?: string[],
) {
  let key: keyof MapVisProps;
  for (key in nextProps) {
    if (Object.prototype.hasOwnProperty.call(nextProps, key)) {
      if (
        (ignore == null || ignore.indexOf(key) === -1) &&
        nextProps[key] !== prevProps[key]
      ) {
        return true;
      }
    }
  }
  return false;
}

export default connect(mapStateToProps, mapDispatchToProps)(MapVis);

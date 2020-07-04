/*
 * App level options panel.
 */
import * as React from 'react';
import {bindActionCreators} from 'redux';
import {Dispatch, connect} from 'react-redux';
import {style} from 'typestyle';

import {RootState, RootAction as Action} from '../../reducers';
import {
  setDisplayParticles,
  setDisplayVectors,
  setDisplaySpeeds,
  setDisplayBackgroundMap,
  togglePaused,
  setZoomLevel,
} from '../MapVis/actions';
import {minZoomLevel, maxZoomLevel} from '../MapVis/reducer';
import {useFrameRate} from '../../utils/hooks';

const buttonStyle = style({width: '100%'});
const formStyle = style({
  gridArea: 'control',
  display: 'flex',
  position: 'relative',
  flexDirection: 'column',
  zIndex: 1,
  padding: '10px',
  cursor: 'auto',
  color: 'white',
  margin: 0,
});

const mapStateToProps = (state: RootState) => ({
  displayParticles: state.mapVis.displayParticles,
  displayVectors: state.mapVis.displayVectors,
  displaySpeeds: state.mapVis.displaySpeeds,
  displayBackgroundMap: state.mapVis.displayBackgroundMap,
  paused: state.mapVis.paused,
  zoomLevel: state.mapVis.zoomLevel,
});

const mapDispatchToProps = (dispatch: Dispatch<Action>) =>
  bindActionCreators(
    {
      setDisplayParticles,
      setDisplayVectors,
      setDisplaySpeeds,
      setDisplayBackgroundMap,
      togglePaused,
      setZoomLevel,
    },
    dispatch,
  );

interface ControlPanelProps {
  displayParticles: boolean;
  displayVectors: boolean;
  displaySpeeds: boolean;
  displayBackgroundMap: boolean;
  paused: boolean;
  zoomLevel: number;
  setDisplayParticles: typeof setDisplayParticles;
  setDisplayVectors: typeof setDisplayVectors;
  setDisplaySpeeds: typeof setDisplaySpeeds;
  setDisplayBackgroundMap: typeof setDisplayBackgroundMap;
  togglePaused: () => Action;
  setZoomLevel: (zoomLevel: number) => Action;
}
function ControlPanel({
  displayVectors,
  displayParticles,
  displaySpeeds,
  displayBackgroundMap,
  paused,
  zoomLevel,
  setDisplayVectors,
  setDisplayParticles,
  setDisplaySpeeds,
  setDisplayBackgroundMap,
  togglePaused,
  setZoomLevel,
}: ControlPanelProps) {
  const frameRate = useFrameRate(6000);

  const handleDisplayVectorsChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setDisplayVectors(event.target.checked);
  };

  const handleDisplayParticlesChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setDisplayParticles(event.target.checked);
  };

  const handleDisplayBackgroundMapChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setDisplayBackgroundMap(event.target.checked);
  };

  const handleDisplaySpeedsChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setDisplaySpeeds(event.target.checked);
  };

  const handleTogglePaused = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    togglePaused();
  };

  const handleZoomLevelChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setZoomLevel(Number.parseFloat(event.target.value));
  };
  return (
    <form className={formStyle}>
      <div>{`FPS: ${frameRate.toFixed(1)}`}</div>
      <label>
        Display Particles:
        <input
          name="displayParticles"
          type="checkbox"
          checked={displayParticles}
          onChange={handleDisplayParticlesChange}
        />
      </label>
      <label>
        Display Vectors:
        <input
          name="displayVectors"
          type="checkbox"
          checked={displayVectors}
          onChange={handleDisplayVectorsChange}
        />
      </label>
      <label>
        Display Speeds:
        <input
          name="displaySpeeds"
          type="checkbox"
          checked={displaySpeeds}
          onChange={handleDisplaySpeedsChange}
        />
      </label>
      <label>
        Display Map:
        <input
          name="displayBackgroundMap"
          type="checkbox"
          checked={displayBackgroundMap}
          onChange={handleDisplayBackgroundMapChange}
        />
      </label>
      <label>
        Zoom:
        <input
          name="zoomLevel"
          type="range"
          min={minZoomLevel.toString()}
          max={maxZoomLevel.toString()}
          step="0.1"
          value={zoomLevel}
          onChange={handleZoomLevelChange}
        />
      </label>
      <button className={buttonStyle} onClick={handleTogglePaused}>
        {paused ? 'Resume' : 'Pause'}
      </button>
    </form>
  );
}
export default connect(mapStateToProps, mapDispatchToProps)(ControlPanel);

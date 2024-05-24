import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ReplayIcon from '@mui/icons-material/Replay';
import BorderColorIcon from '@mui/icons-material/BorderColor';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import StopIcon from '@mui/icons-material/Stop';
import ButtonGroup from '@mui/material/ButtonGroup';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TextField from '@mui/material/TextField';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import SettingsApplications from '@mui/icons-material/SettingsApplications';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import Hotkey from './Hotkey';

import './Controller.css';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';

export enum ControllerEvent {
  Init,
  Ready,
  Play,
  Pause,
  Replay,
  Reset,
  Mark,
  Rec,
  Stop,
}

const Controller = forwardRef(({ canvasRef }: any, ref) => {
  const canvasProps = canvasRef.current ?? {};
  const values = canvasProps['getValues'] ? canvasProps.getValues() : {};

  const [state, setState] = useState<ControllerEvent>(ControllerEvent.Init);
  const [isShowSetting, setShowSetting] = useState<boolean>(false);
  const [lang, setLang] = useState<string>('en');
  const [total, setTotal] = useState<number>(values.total ?? 21);
  const [frame, setFrame] = useState<number>(values.frame ?? 24);
  const [prepare, setPrepare] = useState<number>(values.prepare ?? 3);
  const [frameWidth, setFrameWidth] = useState<string>(values.frameWidth ?? 'normal');
  const [frameThickness, setFrameThickness] = useState<string>(values.frameThickness ?? 'normal');

  const [markingState, setMarkingState] = useState<string>('none');

  useImperativeHandle(ref, () => {
    return {
      changeState(state: ControllerEvent) {
        setState(state);
      }
    };
  }, []);

  useEffect(() => {
    let isPress = false;
    function keydown(e: KeyboardEvent) {
      if (isPress) return;
      isPress = true;
      switch (e.key.toUpperCase()) {
        case 'R':
          replay();
          break;
        case ' ':
          playPauseResume();
          break;
        case 'E':
          markStart();
          break;
        case 'SHIFT':
          markStart();
          break;
        case 'C':
          recRecStop();
          break;
      }
    }
    function keyup(e: KeyboardEvent) {
      isPress = false;
      if (e.key.toUpperCase() === 'SHIFT') {
        markEnd();
      }
    }

    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);

    return () => {
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
    }
  }, [state]);

  function changeState(state: ControllerEvent) {
    switch (state) {
      case ControllerEvent.Play:
        setState(ControllerEvent.Play);
        break;
      case ControllerEvent.Pause:
        setState(ControllerEvent.Pause);
        break;
      case ControllerEvent.Replay:
        setState(ControllerEvent.Play);
        break;
      case ControllerEvent.Reset:
        setState(ControllerEvent.Init);
        break;
      case ControllerEvent.Rec:
        setState(ControllerEvent.Rec);
        break;
      case ControllerEvent.Stop:
      case ControllerEvent.Ready:
        setState(ControllerEvent.Ready);
        break;
    }
    canvasRef.current.changeState(state);
    setShowSetting(false);
  }

  function replay() {
    changeState(ControllerEvent.Replay);
  }

  function playPauseResume() {
    changeState(ControllerEvent.Play !== state ? ControllerEvent.Play : ControllerEvent.Pause);
  }

  function markStart() {
    if (ControllerEvent.Rec === state) {
      setMarkingState('marking');
      canvasProps.startMark();
    } else {
      setMarkingState('none');
      changeState(ControllerEvent.Reset);
    }
  }

  function markEnd() {
    if (ControllerEvent.Rec === state) {
      setMarkingState('marked');
      canvasProps.endMark();
    }
  }

  function recRecStop() {
    if (ControllerEvent.Stop === state) {
      setMarkingState('none');
    }
    changeState(ControllerEvent.Rec === state ? ControllerEvent.Stop : ControllerEvent.Rec);
  }

  return (
    <div className="controller">
      <Card className={`setting-card ${isShowSetting ? 'show' : 'hidden'}`}>
        <CardHeader
          title="Settings"
          subheader="Please change it to the setting you want and use it."
          avatar={<SettingsApplications />}
        />
        <CardContent>
          <Grid container spacing={4}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel id="language-label" size="small">
                  Language
                </InputLabel>
                <Select
                  labelId="language-label"
                  id="language"
                  value={lang}
                  label="Language"
                  size="small"
                  onChange={(e) => setLang(e.target.value)}
                >
                  <MenuItem value="ko">한국어</MenuItem>
                  <MenuItem value="ja">日本語</MenuItem>
                  <MenuItem value="en">English</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                id="sec"
                name="sec"
                label="Seconds"
                size="small"
                autoComplete="off"
                variant="outlined"
                value={total}
                onChange={(e) => {
                  const value = Math.min(300, Math.max(1, Number(e.target.value) || 0));
                  setTotal(value);
                  canvasProps.setTotal(value);
                }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                id="frame"
                name="frame"
                label="Frame Per Second"
                size="small"
                autoComplete="off"
                variant="outlined"
                value={frame}
                onChange={(e) => {
                  const value = Math.min(240, Math.max(1, Number(e.target.value) || 0));
                  setFrame(value);
                  canvasProps.setFrame(value);
                }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                id="prepare"
                name="prepare"
                label="Time to Prepare"
                size="small"
                autoComplete="off"
                variant="outlined"
                value={prepare}
                onChange={(e) => {
                  const value = Math.min(5, Math.max(0, Number(e.target.value) || 0));
                  setPrepare(value);
                  canvasProps.setPrepare(value);
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel id="size-label" size="small">
                  1 Frame Size
                </InputLabel>
                <Select
                  labelId="size-label"
                  id="size"
                  value={frameWidth}
                  label="1 Frame Size"
                  size="small"
                  onChange={(e) => {
                    const value = e.target.value;
                    setFrameWidth(value);
                    canvasProps.setFrameWidth(value);
                  }}
                >
                  <MenuItem value="small">Small</MenuItem>
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="large">Large</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel id="thickness-label" size="small">
                  Thickness
                </InputLabel>
                <Select
                  labelId="thickness-label"
                  id="thickness"
                  value={frameThickness}
                  label="Thickness"
                  size="small"
                  onChange={(e) => {
                    const value = e.target.value;
                    setFrameThickness(value);
                    canvasProps.setFrameThickness(value);
                  }}
                >
                  <MenuItem value="small">Small</MenuItem>
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="large">Large</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
        <CardHeader
          title="Hotkeys"
          subheader="You can use the Hotkeys conveniently."
          avatar={<KeyboardIcon />}
        />
        <CardContent>
          <Stack spacing={{ xs: 1, sm: 2 }} direction="row" useFlexGap flexWrap="wrap">
            <Box sx={{ flexGrow: 1 }}>
              REPLAY: <Hotkey hotkey="R" />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              PLAY / PAUSE / RESUME: <Hotkey hotkey="Space" />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              RESET: <Hotkey hotkey="E" />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              MARKING (Press): <Hotkey hotkey="Shift" />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              REC / STOP: <Hotkey hotkey="C" />
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <ButtonGroup variant="text" color="info">
        <Button
          tabIndex={-1}
          sx={{ color: 'lightblue' }}
          startIcon={<ReplayIcon />}
          disabled={![ControllerEvent.Play, ControllerEvent.Pause].includes(state)}
          onClick={replay}
        >
          Replay
        </Button>
        <Button
          tabIndex={-1}
          sx={{ color: ControllerEvent.Play !== state ? 'green' : 'orange' }}
          startIcon={ControllerEvent.Play !== state ? <PlayArrowIcon /> : <PauseIcon />}
          disabled={![ControllerEvent.Ready, ControllerEvent.Play, ControllerEvent.Pause].includes(state)}
          onClick={playPauseResume}
        >
          {ControllerEvent.Pause === state ? 'Resume' : ControllerEvent.Play === state ? 'Pause' : 'Play'}
        </Button>
        <Button
          tabIndex={-1}
          sx={{ color: 'white' }}
          startIcon={ControllerEvent.Rec === state ? <BorderColorIcon /> : <SettingsBackupRestoreIcon />}
          disabled={(ControllerEvent.Rec !== state && markingState === 'none')}
          onMouseDown={markStart}
          onMouseUp={markEnd}
          onTouchStart={markStart}
          onTouchEnd={markEnd}
        >
          {markingState === 'marking' ? 'Marking' : ControllerEvent.Rec === state ? 'Mark' : 'Reset'}
        </Button>
        <Button
          tabIndex={-1}
          startIcon={ControllerEvent.Rec === state ? <StopIcon /> : <FiberManualRecordIcon />}
          sx={{ color: 'red' }}
          disabled={![ControllerEvent.Init, ControllerEvent.Ready, ControllerEvent.Pause, ControllerEvent.Rec].includes(state)}
          onClick={recRecStop}
        >
          {ControllerEvent.Rec === state ? 'Stop' : 'Rec'}
        </Button>
        <Button
          tabIndex={-1}
          aria-label="setting"
          sx={{ color: 'white' }}
          onClick={() => {
            setShowSetting((prev) => !prev);
          }}
        >
          {isShowSetting ? <ExpandMoreIcon /> : <ExpandLessIcon />}
        </Button>
      </ButtonGroup>
    </div>
  );
});

export default Controller;

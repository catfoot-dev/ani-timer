import { useEffect, useRef } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Controller from './components/Controller';
import Canvas from './components/Canvas';

import './App.css';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

function App() {
  const controllerRef = useRef(null);
  const canvasRef = useRef(null);

  return (
    <ThemeProvider theme={darkTheme}>
      <Controller ref={controllerRef} canvasRef={canvasRef} />
      <Canvas ref={canvasRef} controllerRef={controllerRef} />
    </ThemeProvider>
  );
}

export default App;

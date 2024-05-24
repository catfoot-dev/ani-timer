import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { ControllerEvent } from './Controller';

import './Canvas.css';

const FRAME_WIDTH = { small: 40, normal: 60, large: 80 };
const FRAME_HEIGHT = { small: 5, normal: 10, large: 15 };

const defaultValues = {
  controllerHeight: 80,
  total: 21,
  frame: 24,
  prepare: 3,
  blockWidth: 60,
  blockHeight: 10,
  check: 6, // 
  oneSecBlockHeight: 240, // frame * blockHeight
  rowWidth: 90, // blockWidth + 30
  state: ControllerEvent.Init,
  time: 0,
  start: 0,
  pause: 0,
  recTime: 0,
};

const Canvas = forwardRef(({ controllerRef }: any, ref) => {
  const requestRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const valueRef = useRef<typeof defaultValues>(defaultValues);
  const marksRef = useRef<number[][]>([]);
  const markStartRef = useRef<number>(-1);

  const controllerHeight = 80;

  useImperativeHandle(ref, () => {
    return {
      getValues() {
        const [frameWidth] = Object.entries(FRAME_WIDTH).find(([_, value]) => value === valueRef.current.blockWidth) ?? ['normal'];
        const [frameThickness] = Object.entries(FRAME_HEIGHT).find(([_, value]) => value === valueRef.current.blockHeight) ?? ['normal'];
        return {
          total: valueRef.current.total,
          frame: valueRef.current.frame,
          frameWidth,
          frameThickness,
        };
      },

      setControllerHeight(height: number) {
        valueRef.current.controllerHeight = height;
      },

      setTotal(sec: number) {
        valueRef.current.total = sec;
      },
      
      setFrame(fps: number) {
        valueRef.current.frame = fps;
        valueRef.current.check = fps % 5 ? Math.floor(fps / 4) : Math.floor(fps / 5);
        valueRef.current.oneSecBlockHeight = fps * valueRef.current.blockHeight;
      },

      setPrepare(sec: number) {
        valueRef.current.prepare = sec;
      },

      setFrameWidth(size: keyof typeof FRAME_WIDTH) {
        valueRef.current.blockWidth = FRAME_WIDTH[size];
        valueRef.current.rowWidth = FRAME_WIDTH[size] + 30;
      },

      setFrameThickness(size: keyof typeof FRAME_HEIGHT) {
        valueRef.current.blockHeight = FRAME_HEIGHT[size];
        valueRef.current.oneSecBlockHeight = valueRef.current.frame * FRAME_HEIGHT[size];
      },

      startMark() {
        markStartRef.current = (valueRef.current.time - valueRef.current.start) / 1000;
      },

      endMark() {
        marksRef.current.push([
          markStartRef.current,
          (valueRef.current.time - valueRef.current.start) / 1000,
        ]);
        markStartRef.current = -1;
      },

      changeState(state: ControllerEvent) {
        switch (state) {
          case ControllerEvent.Ready:
            valueRef.current.pause = 0;
            break;
          case ControllerEvent.Play:
            if (valueRef.current.pause === 0) {
              valueRef.current.start = valueRef.current.time;
            } else {
              valueRef.current.start = valueRef.current.start + (valueRef.current.time - valueRef.current.pause);
            }
            valueRef.current.pause = 0;
            break;
          case ControllerEvent.Pause:
            valueRef.current.pause = valueRef.current.time;
            break;
          case ControllerEvent.Replay:
            valueRef.current.start = valueRef.current.time;
            valueRef.current.pause = 0;
            state = ControllerEvent.Play;
            break;
          case ControllerEvent.Reset:
            valueRef.current.state = defaultValues.state;
            valueRef.current.start = defaultValues.start;
            valueRef.current.pause = defaultValues.pause;
            valueRef.current.recTime = defaultValues.recTime;
            marksRef.current = [];
            markStartRef.current = -1;
            break;
          case ControllerEvent.Rec:
            valueRef.current.start = valueRef.current.time;
            valueRef.current.recTime = 0;
            // marksRef.current = [];
            markStartRef.current = -1;
            break;
          case ControllerEvent.Stop:
            valueRef.current.pause = 0;
            valueRef.current.recTime = valueRef.current.time - valueRef.current.start;
            markStartRef.current = -1;
            state = ControllerEvent.Ready;
            break;
        }
        valueRef.current.state = state;
      },
    };
  }, []);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(draw);

    window.addEventListener('resize', resize);

    resize();

    return () => {
      cancelAnimationFrame(requestRef.current);

      window.removeEventListener('resize', resize);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resize() {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;
  }

  function draw(t: DOMHighResTimeStamp) {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      return;
    }

    const {
      total, frame, blockWidth, blockHeight, check, oneSecBlockHeight, rowWidth,
      state, start, pause, recTime,
    } = valueRef.current;
    valueRef.current.time = t;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    const center = Math.floor(width / 2);

    const columns = Math.max(1, Math.floor((height - controllerHeight) / oneSecBlockHeight));
    const rows = Math.ceil(total / columns);
    const rowHeight = oneSecBlockHeight * columns;

    let beginX = 18 + Math.max(0, center - Math.round((rowWidth * rows) / 2));
    let beginY = Math.max(0, (Math.floor(height - controllerHeight) - (columns * oneSecBlockHeight)) / 2);
  
    const ms = t - start;
    const sec = ms / 1000;
    const cnt = sec * oneSecBlockHeight;
    const time = [ControllerEvent.Play, ControllerEvent.Rec].includes(state)
      ? sec : (pause === 0 ? recTime : pause - start) / 1000;

    const marks = [...marksRef.current];
    if (markStartRef.current !== -1 && markStartRef.current < sec) {
      marks.push([markStartRef.current, sec]);
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, width, height); // clear canvas

    ctx.fillStyle = '#ccc';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0;

    ctx.save();
  
    for (let i = 0; i < total; i++) {
      const column = i % columns;
      const row = Math.floor(i / columns);
      const blockBeginX = beginX + rowWidth * row;
      const blockBeginY = beginY + oneSecBlockHeight * column;

      if (column === 0) {
        const rectHeight = row + 1 === rows && total % columns ? (oneSecBlockHeight * (total % columns)) : rowHeight;
        ctx.fillRect(blockBeginX, blockBeginY, blockWidth, rectHeight);
        
        ctx.strokeStyle = '#666';
        ctx.strokeRect(blockBeginX + 1, blockBeginY + 1, blockWidth - 1, rectHeight - 1);
        ctx.restore();

        ctx.strokeRect(blockBeginX, blockBeginY, blockWidth, rectHeight);
        ctx.stroke();
      }
      
      ctx.save();
      ctx.fillStyle = '#f0f';
      for (const [start, end] of marks) {
        if (start > i + 1) {
          break;
        }
        if (end < i) {
          continue;
        }
        const startTime = Math.max(0, start - i);
        const endTime = Math.min(1, end - i);
        ctx.fillRect(blockBeginX + 1, blockBeginY + startTime * oneSecBlockHeight, blockWidth - 2, (endTime - startTime) * oneSecBlockHeight);
      }
      ctx.restore();
      
      ctx.font = '11px Verdana';
      ctx.textAlign = 'right';
      ctx.fillText(`${i}`, blockBeginX - 2, blockBeginY + 5);

      if (column + 1 === columns || i + 1 === total) {
        ctx.fillText(`${i + 1}`, blockBeginX - 2, blockBeginY + oneSecBlockHeight + 5);
      }

      for (let j = 0; j < frame; j++) {
        if (j && j % 2) {
          ctx.save();
          ctx.fillStyle = '#999';
          ctx.font = '7px Verdana';
          ctx.textAlign = 'left';
          ctx.fillText(`${j + 1}`, blockBeginX + blockWidth + 1, blockBeginY + blockHeight * j + blockHeight / 2 + 3);
          ctx.restore();
        }
        if (j % check === 0) {
          ctx.strokeStyle = '#000';
        } else {
          ctx.strokeStyle = '#333';
        }
        ctx.beginPath();
        ctx.moveTo(blockBeginX, blockBeginY + blockHeight * j);
        ctx.lineTo(blockBeginX + blockWidth, blockBeginY + blockHeight * j);
        ctx.stroke();
      }
      
      ctx.restore();
    }

    if (state === ControllerEvent.Play || state === ControllerEvent.Rec) {
      if (cnt > oneSecBlockHeight * total) {
        if (state === ControllerEvent.Play) {
          valueRef.current.pause = 0;
        } else {
          valueRef.current.recTime = total * 1000;
        }
        valueRef.current.state = ControllerEvent.Ready;
        controllerRef.current.changeState(ControllerEvent.Ready);
      } else {
        const row = Math.floor(cnt / rowHeight);
        const pos = cnt % rowHeight;

        if (state === ControllerEvent.Play) {
          ctx.strokeStyle = '#0f0';
        } else {
          ctx.strokeStyle = '#f00';
        }
        
        ctx.beginPath();
        ctx.strokeRect(beginX + rowWidth * row - 10, beginY + pos, blockWidth + 20, 1);
        ctx.stroke();

        ctx.restore();
      }
    
      if (state === ControllerEvent.Play && recTime > 0 && recTime <= ms) {
        valueRef.current.pause = 0;
        valueRef.current.state = ControllerEvent.Ready;
        controllerRef.current.changeState(ControllerEvent.Ready);
      }
    }

    if (pause > 0) {
      const cnt = (pause - start) / 1000 * oneSecBlockHeight;
      let row = Math.floor(cnt / rowHeight);
      let pos = cnt % rowHeight;
      if (pos === 0) {
        row--;
        pos = rowHeight;
      }

      ctx.strokeStyle = '#0f0';
      
      ctx.beginPath();
      ctx.strokeRect(beginX + rowWidth * row - 10, beginY + pos, blockWidth + 20, 1);
      ctx.stroke();

      ctx.restore();
    }

    if (recTime > 0) {
      const cnt = recTime / 1000 * oneSecBlockHeight;
      let row = Math.floor(cnt / rowHeight);
      let pos = cnt % rowHeight;
      if (pos === 0) {
        row--;
        pos = rowHeight;
      }

      ctx.strokeStyle = '#f00';
      
      ctx.beginPath();
      ctx.strokeRect(beginX + rowWidth * row - 10, beginY + pos, blockWidth + 20, 1);
      ctx.stroke();

      ctx.restore();
    }

    const minutes = Math.abs(Math.floor(time / 60));
    const seconds = Math.abs(time % 60);

    ctx.textAlign = 'center';
    ctx.fillText(`${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds.toFixed(3)}`, center, height - 70);
  
    requestAnimationFrame(draw);
  }  

  return <canvas className="canvas" ref={canvasRef} />;
});

export default Canvas;

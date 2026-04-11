import { createSimulatorEngine, type SimulatorEngine } from './engine';
import type { SimulatorConfig, SimulatorWorkerInput, SimulatorResult } from '@/types/simulator';

let engine: SimulatorEngine | null = null;
let configRef: SimulatorConfig | null = null;
let isPaused = false;
let shouldForceFinish = false;
let loopInFlight = false;
let stepsRun = 0;

self.onmessage = (e: MessageEvent<SimulatorWorkerInput>) => {
  const msg = e.data;
  
  if (msg.type === 'START') {
    engine = createSimulatorEngine(msg.config);
    configRef = msg.config;
    isPaused = false;
    shouldForceFinish = false;
    stepsRun = 0;
    void runLoop();
  } else if (msg.type === 'STOP') {
    if (!engine) return;
    shouldForceFinish = true;
    isPaused = false;
    if (!loopInFlight) {
      finalizeAndEmit();
    }
  } else if (msg.type === 'PAUSE') {
    isPaused = true;
  } else if (msg.type === 'RESUME') {
    if (engine && isPaused && !shouldForceFinish) {
      isPaused = false;
      void runLoop();
    }
  }
};

function finalizeAndEmit() {
  if (!engine) return;
  const result: SimulatorResult = engine.finish();
  self.postMessage({ type: 'DONE', payload: result });
  engine = null;
  configRef = null;
  isPaused = false;
  shouldForceFinish = false;
}

async function runLoop() {
  if (!engine || !configRef || loopInFlight) return;

  // Snapshot config for this loop to satisfy strict null checks and avoid
  // repeatedly dereferencing a nullable module-scoped ref.
  const config = configRef;

  loopInFlight = true;

  try {
    const reportInterval = Math.max(1, Math.floor(config.maxHands / 100)); 
    let hasDone = false;

    while (engine && !isPaused && !shouldForceFinish && !hasDone) {
      const { runState, done } = engine.step();
      stepsRun++;
      hasDone = done;

      if (config.delayMs && config.delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, config.delayMs));
      }

      const shouldReport =
        stepsRun % reportInterval === 0 ||
        hasDone ||
        isPaused ||
        shouldForceFinish ||
        (config.delayMs && config.delayMs > 0);

      if (shouldReport) {
          self.postMessage({
              type: 'PROGRESS',
              payload: {
                  ...runState,
                  equityCurveLastPoint: runState.bankrollCurrent
              }
          });
      }
    }

    if (hasDone || shouldForceFinish) {
      finalizeAndEmit();
    }
  } catch(e) {
    const errMessage = e instanceof Error ? e.message : String(e);
    self.postMessage({ type: 'ERROR', error: errMessage });
    engine = null;
    configRef = null;
    isPaused = false;
    shouldForceFinish = false;
  } finally {
    loopInFlight = false;
  }
}

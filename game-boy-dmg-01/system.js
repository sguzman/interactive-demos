import { CANONICAL } from './spec.js';

const clone = value => JSON.parse(JSON.stringify(value));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function createDMGSystem() {
  const state = {
    power: true,
    running: true,
    resetReleased: true,
    rails: { VCC: 6, VDD: 5, VEE: -18 },
    cartridge: { present: true, mapper: 'no-mbc', romBank: 1, ramBank: 0, ramEnabled: false, rtcSeconds: 0 },
    joypad: {
      selectedGroup: 'action',
      buttons: { A: false, B: false, Start: false, Select: false, Right: false, Left: false, Up: false, Down: false },
      lowNibble: 15,
      interruptRequested: false
    },
    demo: { tilePhase: 0, lastAction: 'idle', toneCount: 0 },
    cpu: { address: 0x0100, data: 0, busDomain: 'system', accessAllowed: true, lastTransaction: 'idle' },
    ppu: { ly: 0, dot: 0, mode: 2, fifoBg: 0, fifoObj: 0, visiblePixel: 0, frame: 0, vramCpuAccess: true, oamCpuAccess: false },
    dma: { active: false, bytesMoved: 0, completionCount: 0, sourceHigh: 0xc0 },
    apu: {
      nr50: 0.75,
      physicalVolume: 0.70,
      output: 'speaker',
      channels: {
        CH1: { active: false, phase: 0, amplitude: 0 },
        CH2: { active: false, phase: 0, amplitude: 0 },
        CH3: { active: false, sample: 0, amplitude: 0 },
        CH4: { active: false, lfsr: 0x7fff, amplitude: 0 }
      }
    },
    link: { clockOwner: 'local', bitsRemaining: 0 },
    service: { scenario: 'none', hypotheses: [], observations: [], resolved: false },
    eventLog: []
  };

  function log(event) {
    state.eventLog.push(event);
    if (state.eventLog.length > 80) state.eventLog.shift();
  }

  function recomputePower() {
    state.running = state.power && state.rails.VDD >= 4.5;
    state.resetReleased = state.running;
    if (!state.running) {
      state.apu.channels.CH1.active = false;
      state.cpu.lastTransaction = 'stopped';
    }
  }

  function recomputeJoyp(previousNibble = state.joypad.lowNibble) {
    const b = state.joypad.buttons;
    let nibble = 0x0f;
    const apply = (bit, pressed) => { if (pressed) nibble &= ~(1 << bit); };
    if (state.joypad.selectedGroup === 'action' || state.joypad.selectedGroup === 'both') {
      apply(0, b.A); apply(1, b.B); apply(2, b.Select); apply(3, b.Start);
    }
    if (state.joypad.selectedGroup === 'dpad' || state.joypad.selectedGroup === 'both') {
      apply(0, b.Right); apply(1, b.Left); apply(2, b.Up); apply(3, b.Down);
    }
    state.joypad.lowNibble = nibble;
    const falling = previousNibble & (~nibble) & 0x0f;
    if (falling) {
      state.joypad.interruptRequested = true;
      log('joypad-interrupt-request');
    }
  }

  function pressButton(name, pressed = true) {
    if (!(name in state.joypad.buttons)) return;
    const previous = state.joypad.lowNibble;
    state.joypad.buttons[name] = pressed;
    recomputeJoyp(previous);
    log((pressed ? 'press-' : 'release-') + name);
    if (pressed && name === 'A' && state.running) {
      state.demo.tilePhase = (state.demo.tilePhase + 1) % 4;
      state.demo.lastAction = 'A -> tile + tone';
      state.demo.toneCount += 1;
      state.apu.channels.CH1.active = true;
      state.apu.channels.CH1.amplitude = 12;
      state.apu.channels.CH1.phase = 0;
      state.cpu.address = 0xff00;
      state.cpu.data = state.joypad.lowNibble;
      state.cpu.lastTransaction = 'read JOYP -> update demo';
      log('demo-a-action');
    }
  }

  function selectJoyp(group) {
    const previous = state.joypad.lowNibble;
    state.joypad.selectedGroup = group;
    recomputeJoyp(previous);
    log('joyp-select-' + group);
  }

  function setPower(on) {
    state.power = Boolean(on);
    recomputePower();
    log(state.power ? 'power-on' : 'power-off');
  }

  function setCartridgePresent(present) {
    state.cartridge.present = Boolean(present);
    if (!present) {
      state.cartridge.mapper = 'none';
      state.cpu.lastTransaction = 'cartridge absent';
    } else if (state.cartridge.mapper === 'none') {
      state.cartridge.mapper = 'no-mbc';
    }
    log(present ? 'cartridge-inserted' : 'cartridge-ejected');
  }

  function setMapper(mapper) {
    if (!state.cartridge.present) return false;
    state.cartridge.mapper = mapper;
    state.cartridge.romBank = mapper === 'no-mbc' ? 0 : 1;
    state.cartridge.ramBank = 0;
    state.cartridge.ramEnabled = false;
    log('mapper-' + mapper);
    return true;
  }

  function writeMapper(address, value) {
    if (!state.cartridge.present) return;
    const m = state.cartridge.mapper;
    if (m === 'mbc1') {
      if (address < 0x2000) state.cartridge.ramEnabled = (value & 0x0f) === 0x0a;
      else if (address < 0x4000) state.cartridge.romBank = (value & 0x1f) || 1;
      else if (address < 0x6000) state.cartridge.ramBank = value & 0x03;
    } else if (m === 'mbc2') {
      if (address < 0x4000) {
        if (address & 0x0100) state.cartridge.romBank = (value & 0x0f) || 1;
        else state.cartridge.ramEnabled = (value & 0x0f) === 0x0a;
      }
    } else if (m === 'mbc3') {
      if (address < 0x2000) state.cartridge.ramEnabled = (value & 0x0f) === 0x0a;
      else if (address < 0x4000) state.cartridge.romBank = (value & 0x7f) || 1;
      else if (address < 0x6000) state.cartridge.ramBank = value & 0x0f;
    } else if (m === 'mbc5') {
      if (address < 0x2000) state.cartridge.ramEnabled = (value & 0x0f) === 0x0a;
      else if (address < 0x3000) state.cartridge.romBank = (state.cartridge.romBank & 0x100) | value;
      else if (address < 0x4000) state.cartridge.romBank = (state.cartridge.romBank & 0xff) | ((value & 1) << 8);
      else if (address < 0x6000) state.cartridge.ramBank = value & 0x0f;
    }
    log('mapper-write-' + address.toString(16));
  }

  function resolveCartridgeAddress(address) {
    if (!state.cartridge.present) return { present: false, physical: null };
    if (address < 0x4000) return { present: true, region: 'ROM', bank: 0, physical: address };
    if (address < 0x8000) {
      const bank = state.cartridge.mapper === 'no-mbc' ? 1 : state.cartridge.romBank;
      return { present: true, region: 'ROM', bank, physical: bank * 0x4000 + (address - 0x4000) };
    }
    if (address >= 0xa000 && address < 0xc000) {
      return { present: true, region: 'RAM', bank: state.cartridge.ramBank, physical: state.cartridge.ramBank * 0x2000 + (address - 0xa000) };
    }
    return { present: true, region: 'none', physical: null };
  }

  function updatePpuAccess() {
    state.ppu.vramCpuAccess = state.ppu.mode !== 3;
    state.ppu.oamCpuAccess = state.ppu.mode === 0 || state.ppu.mode === 1;
  }

  function setPpuPosition(ly, dot) {
    state.ppu.ly = clamp(Math.floor(ly), 0, 153);
    state.ppu.dot = clamp(Math.floor(dot), 0, 455);
    if (state.ppu.ly >= 144) state.ppu.mode = 1;
    else if (state.ppu.dot < 80) state.ppu.mode = 2;
    else if (state.ppu.dot < 252) state.ppu.mode = 3;
    else state.ppu.mode = 0;
    state.ppu.fifoBg = state.ppu.mode === 3 ? 8 + (state.ppu.dot % 8) : 0;
    state.ppu.fifoObj = state.ppu.mode === 3 && state.ppu.dot % 32 < 8 ? 4 : 0;
    state.ppu.visiblePixel = state.ppu.mode === 3 ? clamp(state.ppu.dot - 92, 0, 159) : 0;
    updatePpuAccess();
  }

  function startDma(sourceHigh = 0xc0) {
    if (!state.running) return false;
    state.dma.active = true;
    state.dma.bytesMoved = 0;
    state.dma.sourceHigh = sourceHigh & 0xff;
    state.cpu.accessAllowed = false;
    state.cpu.lastTransaction = 'OAM DMA active; HRAM-only CPU access';
    log('oam-dma-start');
    return true;
  }

  function advanceDots(count = 1) {
    let dots = Math.max(0, Math.floor(count));
    while (dots-- > 0) {
      if (state.running) {
        let nextDot = state.ppu.dot + 1;
        let nextLy = state.ppu.ly;
        if (nextDot >= CANONICAL.display.dotsPerLine) {
          nextDot = 0; nextLy += 1;
          if (nextLy >= CANONICAL.display.scanlines) {
            nextLy = 0;
            state.ppu.frame += 1;
          }
        }
        setPpuPosition(nextLy, nextDot);

        if (state.dma.active && (state.ppu.dot % 4 === 0)) {
          state.dma.bytesMoved = Math.min(CANONICAL.dma.bytes, state.dma.bytesMoved + 1);
          if (state.dma.bytesMoved >= CANONICAL.dma.bytes) {
            state.dma.active = false;
            state.dma.completionCount += 1;
            state.cpu.accessAllowed = true;
            state.cpu.lastTransaction = 'OAM DMA complete';
            log('oam-dma-complete');
          }
        }

        if (state.apu.channels.CH1.active) {
          state.apu.channels.CH1.phase = (state.apu.channels.CH1.phase + 1) % 32;
          if (state.apu.channels.CH1.phase === 0) {
            state.apu.channels.CH1.active = false;
            state.apu.channels.CH1.amplitude = 0;
          }
        }
      }

      if (state.cartridge.present && state.cartridge.mapper === 'mbc3') {
        state.cartridge.rtcSeconds += 1 / CANONICAL.masterClockHz;
      }
    }
    return snapshot();
  }

  const scenarios = {
    'none': [],
    'no-power': ['battery/contact path', 'power/reset switch', 'DC/DC converter', 'downstream electronics'],
    'cartridge-boot': ['edge connector', 'cartridge ROM/MBC/PCB', 'console-side connector/bus'],
    'vertical-lines': ['LCD interconnect', 'LCD assembly', 'front-board display path'],
    'buttons': ['plastic/membrane alignment', 'front-board contact', 'P10..P15 / JOYP path'],
    'speaker-silent': ['speaker/wiring', 'front-board path', 'amp/volume path', 'jack switching']
  };

  function setServiceScenario(name) {
    state.service.scenario = name;
    state.service.hypotheses = [...(scenarios[name] || [])];
    state.service.observations = [];
    state.service.resolved = false;
    log('service-' + name);
  }

  function runServiceTest(testName) {
    const s = state.service;
    if (s.scenario === 'no-power' && testName === 'rails') {
      s.observations.push('VCC present; VDD absent');
      s.hypotheses = s.hypotheses.filter(h => h === 'DC/DC converter');
      s.resolved = true;
    } else if (s.scenario === 'cartridge-boot' && testName === 'known-good-cartridge') {
      s.observations.push('Known-good cartridge boots');
      s.hypotheses = s.hypotheses.filter(h => h.includes('cartridge'));
    } else if (s.scenario === 'speaker-silent' && testName === 'headphones') {
      s.observations.push('Headphones produce audio');
      s.hypotheses = s.hypotheses.filter(h => h === 'speaker/wiring' || h === 'front-board path');
    } else if (s.scenario !== 'none') {
      s.observations.push('Inspection recorded');
    }
    log('service-test-' + testName);
    return clone(s);
  }

  function reset() {
    const fresh = createDMGSystem().snapshot();
    Object.keys(state).forEach(key => delete state[key]);
    Object.assign(state, fresh);
  }

  function snapshot() {
    return clone(state);
  }

  setPpuPosition(0, 0);
  recomputeJoyp();

  return {
    state,
    snapshot,
    setPower,
    pressButton,
    selectJoyp,
    setCartridgePresent,
    setMapper,
    writeMapper,
    resolveCartridgeAddress,
    setPpuPosition,
    startDma,
    advanceDots,
    setServiceScenario,
    runServiceTest,
    reset
  };
}

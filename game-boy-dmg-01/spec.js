export const CANONICAL = {
  specimenId: 'specimen:nintendo-game-boy-dmg-01',
  label: 'Nintendo Game Boy DMG-01',
  baseScope: 'original monochrome DMG-01',
  representativeProfile: {
    mainboard: 'DMG-CPU-06',
    lcdBoard: 'DMG-LCD-06',
    converter: 'representative type-D presentation',
    jackBoard: 'representative DMG-JACK-03 presentation',
    universalBomClaim: false,
    geometrySource: 'hybrid: open-console-cad@55081da3b4864aba36082644f9a3c5cedf1061c8 + guighub/DMG-01-Shell@758e2841dc163b472815c39c651df641966e58eb front',
    geometrySourceClass: 'hybrid P4 external assembly reconstruction + independent printable-replica front enclosure'
  },
  masterClockHz: 4194304,
  display: { width: 160, height: 144, scanlines: 154, visibleScanlines: 144, dotsPerLine: 456 },
  dma: { bytes: 160, dots: 640 },
  projectionState: 'public implementation active'
};

export const LAYERS = ['physical', 'electrical', 'logical', 'temporal', 'service'];

export const VIEWS = [
  'product',
  'exploded',
  'power',
  'cpu-memory',
  'cartridge',
  'input',
  'ppu-lcd',
  'apu-audio',
  'service'
];

export const COMPONENTS = {
  shellFront: {
    name: 'Front enclosure',
    category: 'physical assembly',
    provenance: 'P4 independent printable replica · guighub/DMG-01-Shell@758e2841 · registered to assembly envelope',
    description: 'Front enclosure replaced by an independently authored printable replica documented as original-part compatible; upstream notes that some screw holes may be slightly offset.'
  },
  shellRear: {
    name: 'Rear enclosure',
    category: 'physical assembly',
    provenance: 'reference-grounded P4 external CAD reconstruction',
    description: 'Representative rear shell containing battery and cartridge access.'
  },
  mainboard: {
    name: 'DMG-CPU-06 mainboard',
    category: 'PCB assembly',
    provenance: 'board reverse engineering',
    description: 'Representative mainboard revision used as the public physical/electrical anchor. It is not a universal DMG-01 BOM.'
  },
  lcdBoard: {
    name: 'DMG-LCD-06 control/display board',
    category: 'PCB assembly',
    provenance: 'board reverse engineering',
    description: 'Representative front-board revision carrying LCD support, controls, contrast circuitry, and speaker.'
  },
  dmgCpu: {
    name: 'DMG-CPU custom SoC',
    category: 'integrated circuit',
    provenance: 'board + die reverse engineering',
    description: 'Physical custom chip package. It contains the SM83 CPU core plus PPU/APU/timer/serial/joypad/DMA/bus logic.'
  },
  wram: {
    name: 'Work RAM',
    category: 'memory',
    provenance: 'DMG-CPU-06 board reconstruction',
    description: 'External SRAM on the system bus, CPU-visible primarily at C000-DFFF with an echo alias.'
  },
  vram: {
    name: 'Video RAM',
    category: 'memory',
    provenance: 'DMG-CPU-06 board reconstruction',
    description: 'External SRAM on the dedicated video-memory domain, CPU-visible at 8000-9FFF when access is permitted.'
  },
  cartridge: {
    name: 'Removable cartridge module',
    category: 'module',
    provenance: 'P0/P3 interface + reference-grounded P4 cartridge CAD',
    description: 'User-removable hardware/software module behind the 32-contact cartridge interface.'
  },
  powerBoard: {
    name: 'DC/DC converter board',
    category: 'power',
    provenance: 'revision-family reconstruction',
    description: 'Separate converter board producing the main regulated supply and negative LCD-bias rail.'
  },
  jackBoard: {
    name: 'Headphone jack board',
    category: 'audio',
    provenance: 'revision-family reconstruction',
    description: 'Separate audio-output board with switched stereo headphone jack.'
  },
  speaker: {
    name: '8-ohm speaker',
    category: 'acoustic transducer',
    provenance: 'DMG-LCD-06 board reconstruction',
    description: 'Built-in mono speaker mounted with the front assembly.'
  },
  lcd: {
    name: '160 × 144 LCD',
    category: 'display transducer',
    provenance: 'source-grounded function / P4 physical presentation',
    description: 'Physical monochrome display driven by the timed PPU/LCD path.'
  },
  dpad: {
    name: 'D-pad',
    category: 'human input',
    provenance: 'product-obvious / reference-grounded P4 control geometry / board-grounded matrix',
    description: 'Mechanical control whose contacts feed the active-low JOYP matrix.'
  },
  buttonA: {
    name: 'A button',
    category: 'human input',
    provenance: 'product-obvious / reference-grounded P4 control geometry / board-grounded matrix',
    description: 'Physical button mapped to the action-button matrix and software-visible through JOYP.'
  },
  buttonB: {
    name: 'B button',
    category: 'human input',
    provenance: 'product-obvious / reference-grounded P4 control geometry / board-grounded matrix',
    description: 'Physical button mapped to the action-button matrix and software-visible through JOYP.'
  },
  inputContacts: {
    name: 'Front-board input contacts',
    category: 'human input / electrical',
    provenance: 'DMG-LCD-06 board reconstruction / P4 pad geometry',
    description: 'Representative conductive contact regions that bridge mechanical button motion to the P10..P15 matrix.'
  },
  lcdDrivers: {
    name: 'LCD driver/support devices',
    category: 'display electronics',
    provenance: 'DMG-LCD-06 board reconstruction',
    description: 'Representative LH5076/LH5077/IR3E02 package group on the front-board display path.'
  },
  cartridgeConnector: {
    name: '32-contact cartridge connector',
    category: 'module interface',
    provenance: 'DMG-CPU-06 board reconstruction',
    description: 'Console-side cartridge interface carrying address, data, control, power/reference, PHI, reset, and VIN.'
  },
  crystal: {
    name: '4.194304 MHz crystal',
    category: 'clock source',
    provenance: 'DMG-CPU-06 board reconstruction',
    description: 'Physical master oscillator source. Derived machine/peripheral clocks are not separate crystals.'
  }
};

export const MEMORY_MAP = [
  ['0000-3FFF', 'Cartridge ROM bank 00'],
  ['4000-7FFF', 'Switchable cartridge ROM'],
  ['8000-9FFF', 'VRAM'],
  ['A000-BFFF', 'Cartridge RAM / hardware'],
  ['C000-DFFF', 'WRAM'],
  ['E000-FDFF', 'WRAM echo'],
  ['FE00-FE9F', 'OAM'],
  ['FF00-FF7F', 'I/O registers'],
  ['FF80-FFFE', 'HRAM'],
  ['FFFF', 'IE']
];

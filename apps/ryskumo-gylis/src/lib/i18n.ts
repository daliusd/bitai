import type { Lang } from './lang';
import type { FormatId } from './sensors';

export interface Strings {
  title: string;
  description: string;
  crumb: string;
  lede: string;
  languageLabel: string;
  storageNote: string;
  reset: string;

  sceneTitle: string;
  focus: string;
  focusHint: string;
  size: string;
  mapSize: string;
  lock: string;
  lockHint: string;
  thirdStops: string;
  thirdStopsHint: string;
  separateMaps: string;
  separateMapsHint: string;

  viewTitle: string;
  viewHint: string;
  compareAll: string;
  showZone: string;
  noSensors: string;
  behindCamera: string;
  viewAria: (name: string) => string;
  sharpZone: (near: string, far: string) => string;

  mapTitle: string;
  mapHint: string;
  mapAria: string;
  camera: string;
  subject: string;

  sensorsTitle: string;
  sensorsHint: string;
  sensor: (n: number) => string;
  enabled: string;
  format: string;
  formats: Record<FormatId, string>;
  crop: string;
  coc: string;
  focal: string;
  fNumber: string;
  position: string;
  positionHint: string;
  near: string;
  far: string;
  depth: string;
  hyperfocal: string;
  equivalent: string;
  unitM: string;
  unitMm: string;
  notInFront: string;

  aboutTitle: string;
  about: string[];
  formulaTitle: string;
  formulaLegend: string;
  sources: string;
  videos: string;
  history: string;
  footerNote: string;
}

const lt: Strings = {
  title: 'Ryškumo gylio vizualizacija',
  description:
    'Pažiūrėkite, kaip skirtingo dydžio jutikliai su skirtingais objektyvais pasiekia tą patį ryškumo gylį: žemėlapis, skaičiai ir 3D suliejimo vaizdas.',
  crumb: 'ryškumo gylis',
  lede: 'Kaip tą patį vaizdą ir tą patį ryškumo gylį pasiekti su skirtingo dydžio jutikliais? Keiskite židinio nuotolį, diafragmą ir atstumą, o žemėlapyje ir 3D vaizde matysite, kas lieka ryšku, o kas susilieja.',
  languageLabel: 'Kalba',
  storageNote: 'Nustatymai saugomi tik šioje naršyklėje.',
  reset: 'Atstatyti pradinius',

  sceneTitle: 'Scena',
  focus: 'Atstumas iki objekto',
  focusHint: 'Objektas, į kurį fokusuojama',
  size: 'Objekto dydis',
  mapSize: 'Žemėlapio ilgis',
  lock: 'Susieti jutiklius',
  lockHint: 'Keičiant vieno jutiklio objektyvą, kiti prisitaiko, kad vaizdo kampas ir ryškumo gylis liktų tokie patys.',
  thirdStops: 'Trečdalio stopo žingsniai',
  thirdStopsHint: 'Diafragmos slankiklis juda standartiniais žingsniais: f/2,8 → 3,2 → 3,5 → 4…',
  separateMaps: 'Atskiri žemėlapiai',
  separateMapsHint: 'Kiekvienas jutiklis savo žemėlapyje.',

  viewTitle: 'Kaip atrodo nuotrauka',
  viewHint:
    'Kiekvienas scenos daiktas suliejamas tiek, kiek jį sulietų tikras objektyvas: suliejimo skritulio dydis apskaičiuojamas pagal atstumą. Šviesos taškai už objekto virsta „bokeh“ skrituliais.',
  compareAll: 'Visi greta',
  showZone: 'Pažymėti ryškumo zoną',
  noSensors: 'Įjunkite bent vieną jutiklį.',
  behindCamera: 'Objektas yra už fotoaparato arba per arti jo.',
  viewAria: (name) => `Scena pro ${name} fotoaparatą`,
  sharpZone: (near, far) => `Ryšku nuo ${near} iki ${far}`,

  mapTitle: 'Žemėlapis iš viršaus',
  mapHint: 'Spalvotas pleištas – vaizdo kampas, ryškesnė juosta jame – ryškumo gylis.',
  mapAria: 'Vaizdo kampai ir ryškumo gylio zonos iš viršaus',
  camera: 'Fotoaparatas',
  subject: 'Objektas',

  sensorsTitle: 'Jutikliai ir objektyvai',
  sensorsHint: 'Slankikliai turi ribas, bet į laukelius galite įrašyti bet kokį skaičių.',
  sensor: (n) => `Jutiklis ${n}`,
  enabled: 'Rodyti',
  format: 'Formatas',
  formats: {
    large: 'Didelis formatas 4×5″',
    medium: 'Vidutinis formatas',
    ff: 'Pilnas kadras',
    apsc: 'APS-C',
    'apsc-canon': 'APS-C (Canon)',
    m43: 'Micro 4/3',
    'one-inch': '1 colio',
    phone: 'Telefonas',
    custom: 'Kitas',
  },
  crop: 'Apkarpymo koef.',
  coc: 'Neryškumo skritulys',
  focal: 'Židinio nuotolis',
  fNumber: 'Diafragma',
  position: 'Atitraukta atgal',
  positionHint: 'Kiek fotoaparatas stovi už žemėlapio pradžios',
  near: 'Artimoji riba',
  far: 'Tolimoji riba',
  depth: 'Ryškumo gylis',
  hyperfocal: 'Hiperfokalinis',
  equivalent: 'Pilno kadro atitikmuo',
  unitM: 'm',
  unitMm: 'mm',
  notInFront: 'Objektas turi būti prieš fotoaparatą.',

  aboutTitle: 'Kaip tai veikia',
  about: [
    'Ryškumo gylis – atstumų ruožas, kuriame daiktai atrodo pakankamai ryškūs. Taškas už jo ribų jutiklyje virsta skrituliu; kol skritulys mažesnis už „neryškumo skritulį“ (CoC), akis jo neskiria nuo taško.',
    'Mažesnis jutiklis tam pačiam vaizdui reikalauja trumpesnio objektyvo, o tam pačiam ryškumo gyliui – mažesnio diafragmos skaičiaus. Abu dauginami iš apkarpymo koeficiento: 25 mm f/1,8 micro 4/3 jutiklyje atitinka 50 mm f/3,6 pilname kadre.',
    'Pilno kadro neryškumo skritulys – 0,03 mm; kitiems jutikliams jis padalijamas iš apkarpymo koeficiento, nes nuotrauką tenka labiau padidinti.',
  ],
  formulaTitle: 'Formulės',
  formulaLegend: 's – atstumas, f – židinio nuotolis, N – diafragma, c – neryškumo skritulys, d – daikto atstumas.',
  sources: 'Formulės iš',
  videos: 'Verta pažiūrėti:',
  history: 'Pirmoji versija – 2014 m. ffff.lt/dof.html.',
  footerNote: 'Plono lęšio modelis: tikri objektyvai elgiasi panašiai, bet ne identiškai.',
};

const en: Strings = {
  title: 'Depth of field visualization',
  description:
    'See how sensors of different sizes reach the same depth of field with different lenses: a top-down map, the numbers and a 3D blur view.',
  crumb: 'depth of field',
  lede: 'How do you get the same picture and the same depth of field on sensors of different sizes? Change focal length, aperture and distance, and watch on the map and in the 3D view what stays sharp and what melts into blur.',
  languageLabel: 'Language',
  storageNote: 'Settings are kept in this browser only.',
  reset: 'Reset to defaults',

  sceneTitle: 'Scene',
  focus: 'Focus distance',
  focusHint: 'Distance to the subject you focus on',
  size: 'Subject size',
  mapSize: 'Map length',
  lock: 'Lock all sensors',
  lockHint: 'Change one lens and the others follow, keeping the same field of view and depth of field.',
  thirdStops: 'Third stops',
  thirdStopsHint: 'The f-number slider moves in standard steps: f/2.8 → 3.2 → 3.5 → 4…',
  separateMaps: 'Separate maps',
  separateMapsHint: 'Each sensor on its own map.',

  viewTitle: 'What the photo looks like',
  viewHint:
    'Every object in the scene is blurred as much as a real lens would blur it: the blur disc is computed from its distance. The small lights behind the subject turn into bokeh discs.',
  compareAll: 'Side by side',
  showZone: 'Highlight sharp zone',
  noSensors: 'Turn on at least one sensor.',
  behindCamera: 'The subject is behind or too close to the camera.',
  viewAria: (name) => `The scene through the ${name} camera`,
  sharpZone: (near, far) => `Sharp from ${near} to ${far}`,

  mapTitle: 'Top-down map',
  mapHint: 'The coloured wedge is the field of view; the stronger band inside it is the depth of field.',
  mapAria: 'Fields of view and depth-of-field zones from above',
  camera: 'Camera',
  subject: 'Subject',

  sensorsTitle: 'Sensors and lenses',
  sensorsHint: 'Sliders have limits, but you can type any number into the fields.',
  sensor: (n) => `Sensor ${n}`,
  enabled: 'Show',
  format: 'Format',
  formats: {
    large: 'Large format 4×5″',
    medium: 'Medium format',
    ff: 'Full frame',
    apsc: 'APS-C',
    'apsc-canon': 'APS-C (Canon)',
    m43: 'Micro Four Thirds',
    'one-inch': '1-inch',
    phone: 'Phone',
    custom: 'Custom',
  },
  crop: 'Crop factor',
  coc: 'Circle of confusion',
  focal: 'Focal length',
  fNumber: 'Aperture',
  position: 'Stepped back',
  positionHint: 'How far behind the start of the map the camera stands',
  near: 'Near limit',
  far: 'Far limit',
  depth: 'Depth of field',
  hyperfocal: 'Hyperfocal',
  equivalent: 'Full-frame equivalent',
  unitM: 'm',
  unitMm: 'mm',
  notInFront: 'The subject must be in front of the camera.',

  aboutTitle: 'How it works',
  about: [
    'Depth of field is the range of distances where things look acceptably sharp. A point outside it becomes a disc on the sensor; while the disc is smaller than the “circle of confusion” (CoC), the eye cannot tell it from a point.',
    'A smaller sensor needs a shorter lens for the same framing and a smaller f-number for the same depth of field. Both scale with the crop factor: 25 mm f/1.8 on Micro Four Thirds matches 50 mm f/3.6 on full frame.',
    'The full-frame circle of confusion is 0.03 mm; for other sensors it is divided by the crop factor, because their pictures are enlarged more.',
  ],
  formulaTitle: 'Formulas',
  formulaLegend: 's – subject distance, f – focal length, N – f-number, c – circle of confusion, d – object distance.',
  sources: 'Formulas from',
  videos: 'Worth watching:',
  history: 'The first version appeared in 2014 at ffff.lt/dof.html.',
  footerNote: 'Thin-lens model: real lenses behave similarly, but not identically.',
};

export const STRINGS: Record<Lang, Strings> = { lt, en };

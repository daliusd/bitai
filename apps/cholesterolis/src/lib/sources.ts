export interface Source {
  label: string;
  url: string;
}

const pubmed = (id: string) => `https://pubmed.ncbi.nlm.nih.gov/${id}/`;

export const SOURCES = {
  escEas2019: {
    label: 'Mach F. ir kt. 2019 ESC/EAS dislipidemijų gydymo gairės. Eur Heart J, 2020',
    url: pubmed('31504418'),
  },
  nordestgaard2016: {
    label: 'Nordestgaard B.G. ir kt. Lipidų tyrimas nevalgius nebūtinas (EAS/EFLM sutarimas). Eur Heart J, 2016',
    url: pubmed('27122601'),
  },
  dattilo1992: {
    label: 'Dattilo A.M., Kris-Etherton P.M. Svorio mažinimo poveikis kraujo lipidams: metaanalizė (70 tyrimų). Am J Clin Nutr, 1992',
    url: pubmed('1386186'),
  },
  zomer2016: {
    label: 'Zomer E. ir kt. Svorio mažinimo intervencijos ir širdies bei kraujagyslių rizikos veiksniai: metaanalizė. Obes Rev, 2016',
    url: pubmed('27324830'),
  },
  mensink2016: {
    label: 'Mensink R.P. Sočiųjų riebalų rūgščių poveikis serumo lipidams: sisteminė apžvalga ir regresinė analizė. PSO (WHO), 2016',
    url: 'https://iris.who.int/handle/10665/246104',
  },
  hooper2020: {
    label: 'Hooper L. ir kt. Sočiųjų riebalų mažinimas ir širdies bei kraujagyslių ligos. Cochrane apžvalga, 2020',
    url: pubmed('32827219'),
  },
  whoHealthyDiet: {
    label: 'PSO (WHO). Sveika mityba – faktų suvestinė',
    url: 'https://www.who.int/news-room/fact-sheets/detail/healthy-diet',
  },
  teMorenga2014: {
    label: 'Te Morenga L.A. ir kt. Cukrus ir kardiometabolinė rizika: atsitiktinių imčių tyrimų metaanalizė. Am J Clin Nutr, 2014',
    url: pubmed('24808490'),
  },
  brown1999: {
    label: 'Brown L. ir kt. Maistinių skaidulų poveikis cholesteroliui: 67 tyrimų metaanalizė. Am J Clin Nutr, 1999',
    url: pubmed('9925120'),
  },
  whitehead2014: {
    label: 'Whitehead A. ir kt. Avižų beta gliukano poveikis cholesteroliui: metaanalizė. Am J Clin Nutr, 2014',
    url: pubmed('25411276'),
  },
  ras2014: {
    label: 'Ras R.T. ir kt. Augalinių sterolių ir stanolių poveikis MTL pagal dozę: metaanalizė. Br J Nutr, 2014',
    url: pubmed('24780090'),
  },
  delGobbo2015: {
    label: 'Del Gobbo L.C. ir kt. Riešutų poveikis kraujo lipidams: 61 tyrimo metaanalizė. Am J Clin Nutr, 2015',
    url: pubmed('26561616'),
  },
  jenkins2003: {
    label: 'Jenkins D.J. ir kt. „Portfelio“ dieta prieš lovastatiną. JAMA, 2003',
    url: pubmed('12876093'),
  },
  kodama2007: {
    label: 'Kodama S. ir kt. Aerobinio fizinio krūvio poveikis DTL cholesteroliui: metaanalizė. Arch Intern Med, 2007',
    url: pubmed('17533202'),
  },
  maeda2003: {
    label: 'Maeda K. ir kt. Metimo rūkyti poveikis lipidams: metaanalizė. Prev Med, 2003',
    url: pubmed('14507483'),
  },
  forey2013: {
    label: 'Forey B.A. ir kt. Metimo rūkyti poveikis DTL cholesteroliui. Biomark Res, 2013',
    url: pubmed('24252691'),
  },
  rimm1999: {
    label: 'Rimm E.B. ir kt. Saikingas alkoholio vartojimas ir lipidai: metaanalizė. BMJ, 1999',
    url: pubmed('10591709'),
  },
  holmes2014: {
    label: 'Holmes M.V. ir kt. Alkoholis ir širdies ligos: Mendelio randomizacijos analizė. BMJ, 2014',
    url: pubmed('25011450'),
  },
  ctt2010: {
    label: 'Cholesterol Treatment Trialists’ (CTT). Intensyvesnio MTL mažinimo veiksmingumas ir saugumas (170 000 dalyvių). Lancet, 2010',
    url: pubmed('21067804'),
  },
  skulasRay2019: {
    label: 'Skulas-Ray A.C. ir kt. Omega-3 riebalų rūgštys padidėjusiems trigliceridams gydyti. AHA mokslinė rekomendacija. Circulation, 2019',
    url: pubmed('31422671'),
  },
  wang2023: {
    label: 'Wang T. ir kt. Omega-3 dozės ir kraujo lipidų ryšys: 90 atsitiktinių imčių tyrimų metaanalizė. J Am Heart Assoc, 2023',
    url: pubmed('37264945'),
  },
  gencer2021: {
    label: 'Gencer B. ir kt. Ilgalaikis omega-3 vartojimas ir prieširdžių virpėjimo rizika: metaanalizė. Circulation, 2021',
    url: pubmed('34612056'),
  },
  mansoor2016: {
    label: 'Mansoor N. ir kt. Mažai angliavandenių turinčios dietos prieš mažai riebalų turinčias: metaanalizė. Br J Nutr, 2016',
    url: pubmed('26768850'),
  },
  graudal2020: {
    label: 'Graudal N.A. ir kt. Mažai ir daug druskos turinčios mitybos poveikis kraujospūdžiui, cholesteroliui ir trigliceridams. Cochrane apžvalga, 2020',
    url: pubmed('33314019'),
  },
  kruisbrink2017: {
    label: 'Kruisbrink M. ir kt. Miego trukmės bei kokybės ir kraujo lipidų ryšys: prospektyvinių tyrimų metaanalizė. BMJ Open, 2017',
    url: pubmed('29247105'),
  },
  steptoe2005: {
    label: 'Steptoe A., Brydon L. Lipidų reakcija į ūmų stresą ir cholesterolis po 3 metų. Health Psychol, 2005',
    url: pubmed('16287406'),
  },
  smith1993: {
    label: 'Smith S.J. ir kt. Biologinis serumo lipidų kintamumas: 30 tyrimų apžvalga. Clin Chem, 1993',
    url: pubmed('8504530'),
  },
  fraser2011: {
    label: 'Fraser C.G. Reikšmingo pokyčio ribos (reference change values). Clin Chem Lab Med, 2011',
    url: pubmed('21958344'),
  },
} satisfies Record<string, Source>;

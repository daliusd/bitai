export interface Source {
  label: string;
  url: string;
}

const pubmed = (id: string) => `https://pubmed.ncbi.nlm.nih.gov/${id}/`;

export const SOURCES = {
  esc2024: {
    label: 'McEvoy J.W. ir kt. 2024 ESC padidėjusio kraujospūdžio ir hipertenzijos gydymo gairės. Eur Heart J, 2024',
    url: pubmed('39210715'),
  },
  stergiou2021: {
    label: 'Stergiou G.S. ir kt. 2021 ESH kraujospūdžio matavimo gydytojo kabinete ir namuose rekomendacijos. J Hypertens, 2021',
    url: pubmed('33710173'),
  },
  kallioinen2017: {
    label: 'Kallioinen N. ir kt. Kraujospūdžio matavimo netikslumų šaltiniai: sisteminė apžvalga. J Hypertens, 2017',
    url: pubmed('27977471'),
  },
  neter2003: {
    label: 'Neter J.E. ir kt. Svorio mažinimo poveikis kraujospūdžiui: 25 atsitiktinių imčių tyrimų metaanalizė. Hypertension, 2003',
    url: pubmed('12975389'),
  },
  he2013: {
    label: 'He F.J., Li J., MacGregor G.A. Ilgalaikio nedidelio druskos mažinimo poveikis kraujospūdžiui: Cochrane apžvalga ir metaanalizė. BMJ, 2013',
    url: pubmed('23558162'),
  },
  filippini2021: {
    label: 'Filippini T. ir kt. Natrio mažinimo poveikis kraujospūdžiui: dozės ir atsako metaanalizė. Circulation, 2021',
    url: pubmed('33586450'),
  },
  yin2022: {
    label: 'Yin X. ir kt. Druskos pakaitalų poveikis kraujospūdžiui ir klinikinėms baigtims: 21 tyrimo metaanalizė. Heart, 2022',
    url: pubmed('35945000'),
  },
  aburto2013: {
    label: 'Aburto N.J. ir kt. Didesnio kalio kiekio poveikis širdies ir kraujagyslių rizikos veiksniams: metaanalizė. BMJ, 2013',
    url: pubmed('23558164'),
  },
  filippou2020: {
    label: 'Filippou C.D. ir kt. DASH dieta ir kraujospūdžio mažėjimas: 30 atsitiktinių imčių tyrimų metaanalizė. Adv Nutr, 2020',
    url: pubmed('32330233'),
  },
  sacks2001: {
    label: 'Sacks F.M. ir kt. Mažiau natrio ir DASH dietos poveikis kraujospūdžiui (DASH-Sodium tyrimas). N Engl J Med, 2001',
    url: pubmed('11136953'),
  },
  edwards2023: {
    label: 'Edwards J.J. ir kt. Fizinio krūvio treniruotės ir ramybės kraujospūdis: 270 tyrimų tinklinė metaanalizė. Br J Sports Med, 2023',
    url: pubmed('37491419'),
  },
  roerecke2017: {
    label: 'Roerecke M. ir kt. Alkoholio vartojimo mažinimo poveikis kraujospūdžiui: 36 tyrimų metaanalizė. Lancet Public Health, 2017',
    url: pubmed('29253389'),
  },
  law2009: {
    label: 'Law M.R., Morris J.K., Wald N.J. Kraujospūdį mažinantys vaistai širdies ir kraujagyslių ligų prevencijai: 147 tyrimų metaanalizė. BMJ, 2009',
    url: pubmed('19454737'),
  },
  bplttc2021: {
    label: 'Blood Pressure Lowering Treatment Trialists’ Collaboration. Kraujospūdžio mažinimas vaistais esant įvairiam kraujospūdžiui: 48 tyrimų metaanalizė. Lancet, 2021',
    url: pubmed('33933205'),
  },
} satisfies Record<string, Source>;

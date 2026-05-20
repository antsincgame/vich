import type { Bilingual } from '../lib/types'

export type ResearchCategory = 'cure' | 'treatment' | 'prevention'

export interface ResearchItem {
  id: string
  category: ResearchCategory
  title: Bilingual
  status: Bilingual
  body: Bilingual
  sources: { label: string; url: string }[]
  reviewed: string
}

// Reviewed May 2026. Summaries are educational; always verify against primary
// sources and current clinical guidelines.
export const RESEARCH: ResearchItem[] = [
  {
    id: 'stemcell',
    category: 'cure',
    title: { ru: 'Излечение трансплантацией стволовых клеток', en: 'Stem-cell transplant cures' },
    status: { ru: '~7 человек в ремиссии / излечены', en: '~7 people in remission / cured' },
    body: {
      ru: 'Около семи человек считаются излеченными или в длительной ремиссии после трансплантации костного мозга (Берлин ×2, Лондон, Дюссельдорф, Нью-Йорк, City of Hope, Женева). Второй «берлинский пациент» (AIDS 2024) получил клетки донора с гетерозиготной мутацией CCR5-Δ32; женевский случай — донор «дикого типа». Метод применяют только при раке крови, он рискованный и не масштабируется.',
      en: 'About seven people are considered cured or in long-term remission after a bone-marrow transplant (Berlin ×2, London, Düsseldorf, New York, City of Hope, Geneva). The second "Berlin patient" (AIDS 2024) received cells from a donor with a heterozygous CCR5-Δ32 mutation; the Geneva case used a wild-type donor. Done only for blood cancers, it is high-risk and not scalable.',
    },
    sources: [
      { label: 'amfAR — how many cured', url: 'https://www.amfar.org/news/how-many-have-been-cured/' },
      { label: 'aidsmap — second Berlin patient (EACS 2025)', url: 'https://www.aidsmap.com/news/oct-2025/second-berlin-patient-has-unusual-immune-response-seems-have-removed-his-hiv' },
    ],
    reviewed: '2026-05',
  },
  {
    id: 'bnabs',
    category: 'cure',
    title: { ru: 'Широко нейтрализующие антитела (bNAbs)', en: 'Broadly neutralising antibodies (bNAbs)' },
    status: { ru: 'Клинические испытания, ремиссия у части участников', en: 'Clinical trials; remission in some participants' },
    body: {
      ru: 'В испытании RIO более половины участников сохраняли низкую/неопределяемую нагрузку свыше 20 недель после отмены АРТ, получив две bNAbs. В других работах сочетание bNAbs с иммуностимуляторами (например, vesatolimod) удерживало часть участников в ремиссии более двух лет. Комбинации антител и иммуномодуляторов активно изучаются.',
      en: 'In the RIO trial, over half of participants kept a low/undetectable viral load for more than 20 weeks after stopping ART, having received two bNAbs. Elsewhere, combining bNAbs with immune stimulators (e.g. vesatolimod) kept some participants in remission for over two years. Antibody + immunomodulator combinations are under active study.',
    },
    sources: [
      { label: 'aidsmap — CROI 2026 top cure stories', url: 'https://www.aidsmap.com/news/apr-2026/top-5-stories-search-hiv-cure-croi-2026' },
    ],
    reviewed: '2026-05',
  },
  {
    id: 'crispr',
    category: 'cure',
    title: { ru: 'Генное редактирование (CRISPR, EBT-101)', en: 'Gene editing (CRISPR, EBT-101)' },
    status: { ru: 'Безопасно в фазе 1/2, но рецидив не предотвращён', en: 'Safe in phase 1/2, but did not prevent rebound' },
    body: {
      ru: 'EBT-101 (Excision) использует CRISPR-Cas9 с доставкой AAV9 для вырезания участков генома ВИЧ. В фазе 1/2 терапия была безопасной, но не предотвратила возврат вируса после отмены АРТ. Изучаются более высокие дозы и доставка липидными наночастицами для повторного дозирования.',
      en: 'EBT-101 (Excision) uses CRISPR-Cas9 delivered by AAV9 to excise parts of the HIV genome. In phase 1/2 it was safe but did not prevent viral rebound after stopping ART. Higher doses and lipid-nanoparticle delivery for redosing are being explored.',
    },
    sources: [
      { label: 'aidsmap — EBT-101 does not prevent rebound', url: 'https://www.aidsmap.com/news/may-2024/crispr-gene-therapy-ebt-101-does-not-prevent-hiv-viral-rebound' },
      { label: 'CRISPR Medicine News — EBT-101', url: 'https://crisprmedicinenews.com/news/excisions-ebt-101-demonstrates-safety-in-clinical-trial-but-does-not-cure-hiv/' },
    ],
    reviewed: '2026-05',
  },
  {
    id: 'latency',
    category: 'cure',
    title: { ru: '«Shock and kill» и «block and lock»', en: '"Shock and kill" and "block and lock"' },
    status: { ru: 'Доклинические и ранние клинические', en: 'Preclinical & early clinical' },
    body: {
      ru: 'Стратегии работают с латентным резервуаром: «shock and kill» реактивирует скрытый вирус, чтобы иммунитет/препараты уничтожили заражённые клетки; «block and lock» — наоборот, стойко «запирает» провирус в неактивном состоянии. Пока ни одна не даёт устойчивого излечения у людей.',
      en: 'These target the latent reservoir: "shock and kill" reactivates hidden virus so the immune system/drugs can clear infected cells; "block and lock" instead permanently silences the provirus. Neither yet delivers durable cure in humans.',
    },
    sources: [
      { label: 'aidsmap — CROI 2026 cure stories', url: 'https://www.aidsmap.com/news/apr-2026/top-5-stories-search-hiv-cure-croi-2026' },
    ],
    reviewed: '2026-05',
  },
  {
    id: 'art',
    category: 'treatment',
    title: { ru: 'Антиретровирусная терапия (АРТ) первой линии', en: 'First-line antiretroviral therapy (ART)' },
    status: { ru: 'Стандарт лечения, начинать сразу', en: 'Standard of care, start promptly' },
    body: {
      ru: 'Предпочтительны схемы на основе ингибиторов интегразы (INSTI): долутегравир (предпочтение ВОЗ) или биктегравир/TAF/FTC. Схемы простые (1–2 таблетки в день) и хорошо переносятся. При неудаче на долутегравире опорным становится бустированный дарунавир. АРТ рекомендуется всем людям с ВИЧ как можно раньше.',
      en: 'Integrase-inhibitor (INSTI)-based regimens are preferred: dolutegravir (WHO-preferred) or bictegravir/TAF/FTC. Regimens are simple (1–2 pills/day) and well tolerated. After dolutegravir failure, boosted darunavir is the anchor. ART is recommended for everyone with HIV, as early as possible.',
    },
    sources: [
      { label: 'NIH HIV clinical guidelines', url: 'https://clinicalinfo.hiv.gov/en/guidelines/hiv-clinical-guidelines-adult-and-adolescent-arv/initiation-antiretroviral-therapy' },
      { label: 'WHO HIV guidelines update', url: 'https://www.emjreviews.com/microbiology-infectious-diseases/news/who-hiv-guidelines-reshape-treatment-and-prevention/' },
    ],
    reviewed: '2026-05',
  },
  {
    id: 'longacting',
    category: 'treatment',
    title: { ru: 'Длительно действующие инъекции', en: 'Long-acting injectables' },
    status: { ru: 'Одобрены; помогают с приверженностью', en: 'Approved; support adherence' },
    body: {
      ru: 'Инъекции каботегравир + рилпивирин раз в 1–2 месяца заменяют ежедневные таблетки у людей с подавленной нагрузкой. ВОЗ (2026) впервые рекомендует длительно действующие инъекции в отдельных случаях — например, при трудностях с ежедневным приёмом.',
      en: 'Cabotegravir + rilpivirine injections every 1–2 months can replace daily pills for people who are virally suppressed. WHO (2026) now recommends long-acting injectables in specific situations, e.g. when daily adherence is difficult.',
    },
    sources: [
      { label: 'WHO HIV guidelines update', url: 'https://www.emjreviews.com/microbiology-infectious-diseases/news/who-hiv-guidelines-reshape-treatment-and-prevention/' },
    ],
    reviewed: '2026-05',
  },
  {
    id: 'prep',
    category: 'prevention',
    title: { ru: 'PrEP, включая ленакапавир дважды в год', en: 'PrEP, including twice-yearly lenacapavir' },
    status: { ru: 'Высокоэффективна; новые формы', en: 'Highly effective; new options' },
    body: {
      ru: 'Доконтактная профилактика (PrEP) предотвращает заражение. Инъекционный ленакапавир дважды в год одобрен FDA 18.06.2025 (Yeztugo; в ЕС — Yeytuo) с эффективностью 96–100% в испытаниях. Доступны также пероральные TDF/FTC и TAF/FTC и инъекции каботегравира раз в 2 месяца; разрабатывается форма раз в год.',
      en: 'Pre-exposure prophylaxis (PrEP) prevents infection. Twice-yearly injectable lenacapavir was FDA-approved 18 Jun 2025 (Yeztugo; EU Yeytuo), with 96–100% efficacy in trials. Oral TDF/FTC and TAF/FTC and bimonthly cabotegravir injections are also available; a once-yearly form is in development.',
    },
    sources: [
      { label: 'WHO — FDA approval of injectable lenacapavir', url: 'https://www.who.int/news/item/19-06-2025-fda-approval-of-injectable-lenacapavir-marks-progress-for-hiv-prevention' },
      { label: 'CDC MMWR — lenacapavir PrEP recommendation', url: 'https://www.cdc.gov/mmwr/volumes/74/wr/mm7435a1.htm' },
    ],
    reviewed: '2026-05',
  },
  {
    id: 'uequ',
    category: 'prevention',
    title: { ru: 'U=U — Неопределяемый = Непередающий', en: 'U=U — Undetectable = Untransmittable' },
    status: { ru: 'Прочный научный консенсус', en: 'Strong scientific consensus' },
    body: {
      ru: 'Человек с ВИЧ на лечении и со стойко неопределяемой нагрузкой не передаёт вирус половым путём (риск нулевой). Подтверждено исследованиями PARTNER, PARTNER2, HPTN 052, Opposites Attract. Подавлением обычно считают < 200 копий/мл.',
      en: 'A person with HIV on treatment with a sustained undetectable viral load does not transmit the virus sexually (zero risk). Established by PARTNER, PARTNER2, HPTN 052 and Opposites Attract. Suppression is usually defined as < 200 copies/mL.',
    },
    sources: [
      { label: 'CDC — Undetectable = Untransmittable', url: 'https://www.cdc.gov/global-hiv-tb/php/our-approach/undetectable-untransmittable.html' },
      { label: 'aidsmap — undetectable viral load & transmission', url: 'https://www.aidsmap.com/about-hiv/undetectable-viral-load-and-hiv-transmission' },
    ],
    reviewed: '2026-05',
  },
]

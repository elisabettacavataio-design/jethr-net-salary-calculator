import { FISCAL_YEAR, TAX_CONFIG_2026 } from '../calculator/taxConfig2026'

/** Assumptions the model makes, shown in the transparency section. */
export const MODEL_ASSUMPTIONS: ReadonlyArray<{ label: string; value: string }> = [
  { label: 'Anno fiscale', value: String(FISCAL_YEAR) },
  { label: 'Residenza fiscale', value: 'Milano, Lombardia' },
  { label: 'Contratto', value: 'Dipendente a tempo indeterminato' },
  { label: 'Durata rapporto', value: `Intero anno fiscale ${FISCAL_YEAR}` },
  {
    label: 'Contributi',
    value: `Aliquota previdenziale standard assunta: ${(
      TAX_CONFIG_2026.employeeContributionRate * 100
    )
      .toFixed(2)
      .replace('.', ',')}%`,
  },
  {
    label: 'Mensilità',
    value: 'Usate solo per distribuire il netto annuale medio',
  },
]

/** What the model deliberately leaves out. */
export const MODEL_EXCLUSIONS: readonly string[] = [
  'specificità del CCNL o del settore',
  'familiari a carico',
  'detrazioni personali',
  'trattamento integrativo',
  'welfare aziendale',
  'fringe benefit',
  'premi e bonus',
  'straordinari',
  'assenze',
  'TFR',
  'conguagli di fine anno',
  'la reale distribuzione delle ritenute nelle singole mensilità',
]

/**
 * Short explanations surfaced through progressive disclosure.
 * Copy only — no fiscal logic, no numbers that the engine already returns.
 */
export type GlossaryKey =
  | 'contributions'
  | 'taxableIncome'
  | 'irpef'
  | 'employeeDeduction'
  | 'regionalTax'
  | 'municipalTax'

export const GLOSSARY: Record<GlossaryKey, { term: string; description: string }> = {
  contributions: {
    term: 'Contributi previdenziali',
    description:
      'La quota che finanzia la tua pensione e le tutele previdenziali. Viene trattenuta dalla RAL prima di calcolare le imposte: non sono tasse.',
  },
  taxableIncome: {
    term: 'Imponibile fiscale',
    description:
      'La RAL meno i contributi previdenziali. È la base su cui si calcolano IRPEF e addizionali.',
  },
  irpef: {
    term: 'IRPEF',
    description:
      "L'imposta sul reddito. È progressiva: ogni scaglione di reddito ha la sua aliquota, non si applica un'unica percentuale a tutto il reddito.",
  },
  employeeDeduction: {
    term: 'Detrazione da lavoro dipendente',
    description:
      "Uno sconto sull'IRPEF riconosciuto a chi ha un reddito da lavoro dipendente. Diminuisce al crescere del reddito e si azzera sopra i 50.000 € di imponibile.",
  },
  regionalTax: {
    term: 'Addizionale regionale',
    description:
      "L'imposta della Regione di residenza fiscale. In Lombardia è progressiva per scaglioni, come l'IRPEF.",
  },
  municipalTax: {
    term: 'Addizionale comunale',
    description:
      "L'imposta del Comune di residenza fiscale. A Milano si applica solo sopra i 23.000 € di imponibile: è una soglia di esenzione, quindi superandola l'aliquota si applica a tutto l'imponibile.",
  },
}

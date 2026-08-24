import type { SalaryCalculationResult } from '../calculator/types'
import type { GlossaryKey } from '../content/glossary'

/**
 * Presentation logic: turns the single engine result into the rows the UI
 * renders. No arithmetic beyond selecting and labelling values.
 */

export type BreakdownTone = 'base' | 'deduction' | 'addition' | 'total'

export type BreakdownRow = {
  id: string
  label: string
  /** Optional second line, to avoid packing two technical terms into a label. */
  note?: string
  amount: number
  tone: BreakdownTone
  glossaryKey?: GlossaryKey
}

/**
 * The essential breakdown: four numbers that answer "where does my RAL go?".
 * The split of the taxes into their components is one level down, in
 * `buildTaxDetailRows`, so the main view stays readable.
 */
export function buildBreakdownRows(
  result: SalaryCalculationResult,
): BreakdownRow[] {
  const rows: BreakdownRow[] = [
    {
      id: 'gross-annual-salary',
      label: 'Retribuzione annua lorda',
      amount: result.grossAnnualSalary,
      tone: 'base',
    },
    {
      id: 'contributions',
      label: 'Contributi previdenziali',
      amount: result.contributions,
      tone: 'deduction',
      glossaryKey: 'contributions',
    },
    {
      id: 'total-taxes',
      label: 'Totale imposte',
      amount: result.totalTaxes,
      tone: 'deduction',
    },
  ]

  // Shown only when it applies, otherwise the figures would not add up.
  if (result.taxWedgeBonus > 0) {
    rows.push({
      id: 'tax-wedge-bonus',
      label: 'Somma non imponibile',
      note: 'Riduzione del cuneo fiscale',
      amount: result.taxWedgeBonus,
      tone: 'addition',
    })
  }

  rows.push({
    id: 'annual-net',
    label: 'Netto annuale stimato',
    amount: result.annualNet,
    tone: 'total',
  })

  return rows
}

/** The components of `totalTaxes`, one level below the essential breakdown. */
export function buildTaxDetailRows(
  result: SalaryCalculationResult,
): BreakdownRow[] {
  return [
    {
      id: 'net-irpef',
      label: 'IRPEF',
      amount: result.netIrpef,
      tone: 'deduction',
      glossaryKey: 'irpef',
    },
    {
      id: 'regional-tax',
      label: 'Addizionale regionale',
      amount: result.regionalTax,
      tone: 'deduction',
      glossaryKey: 'regionalTax',
    },
    {
      id: 'municipal-tax',
      label: 'Addizionale comunale',
      amount: result.municipalTax,
      tone: 'deduction',
      glossaryKey: 'municipalTax',
    },
    {
      id: 'total-taxes-detail',
      label: 'Totale imposte',
      amount: result.totalTaxes,
      tone: 'total',
    },
  ]
}

/** Rows of the collapsible "how IRPEF was built" detail. */
export function buildIrpefDetailRows(
  result: SalaryCalculationResult,
): BreakdownRow[] {
  const rows: BreakdownRow[] = [
    {
      id: 'taxable-income',
      label: 'Imponibile fiscale',
      amount: result.taxableIncome,
      tone: 'base',
      glossaryKey: 'taxableIncome',
    },
    {
      id: 'gross-irpef',
      label: 'IRPEF lorda',
      amount: result.grossIrpef,
      tone: 'base',
    },
    {
      id: 'employee-deduction',
      label: 'Detrazione da lavoro dipendente',
      amount: result.employeeDeduction,
      tone: 'deduction',
      glossaryKey: 'employeeDeduction',
    },
  ]

  if (result.taxWedgeDeduction > 0) {
    rows.push({
      id: 'tax-wedge-deduction',
      label: 'Ulteriore detrazione (cuneo fiscale)',
      amount: result.taxWedgeDeduction,
      tone: 'deduction',
    })
  }

  rows.push({
    id: 'net-irpef-detail',
    label: 'IRPEF netta',
    amount: result.netIrpef,
    tone: 'total',
  })

  return rows
}

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import App from './App'

async function calculate(salary: string) {
  const user = userEvent.setup()

  await user.clear(screen.getByLabelText(/retribuzione annua lorda/i))

  if (salary !== '') {
    await user.type(screen.getByLabelText(/retribuzione annua lorda/i), salary)
  }

  await user.click(screen.getByRole('button', { name: /calcola il netto/i }))

  return user
}

describe('App', () => {
  it('shows no result before the user calculates', () => {
    render(<App />)

    expect(screen.queryByText(/netto annuale stimato/i)).not.toBeInTheDocument()
  })

  it('defaults to 13 payments', () => {
    render(<App />)

    expect(screen.getByRole('radio', { name: '13' })).toBeChecked()
  })

  it.each([
    ['', /inserisci la tua ral/i],
    ['abc', /solo cifre/i],
    ['0', /maggiore di zero/i],
    ['-100', /maggiore di zero/i],
  ])('rejects %s with an accessible error', async (input, message) => {
    render(<App />)
    await calculate(input)

    const error = screen.getByRole('alert')
    expect(error).toHaveTextContent(message)
    expect(screen.getByLabelText(/retribuzione annua lorda/i)).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    expect(screen.queryByText(/netto annuale stimato/i)).not.toBeInTheDocument()
  })

  it('shows the golden figures for a RAL of 40.000 over 13 payments', async () => {
    render(<App />)
    await calculate('40000')

    // 27.960 / 13 = 2.151
    expect(screen.getByText('2.151 €')).toBeInTheDocument()
    expect(screen.getAllByText('27.960 €').length).toBeGreaterThan(0)
    expect(screen.getByText('Netto medio per mensilità')).toBeInTheDocument()
  })

  it('states the transformation from RAL to net in the result block', async () => {
    render(<App />)
    await calculate('40000')

    expect(screen.getByText(/netti all’anno su/i)).toHaveTextContent(
      /27\.960 €.*netti all’anno su.*40\.000 €.*di RAL/,
    )
    expect(screen.getByText(/ti resta circa/i)).toHaveTextContent('69,9%')
  })

  it('credits the tax-wedge allowance when the net share exceeds the RAL split', async () => {
    render(<App />)
    await calculate('22000')

    // 18.723 / 22.000 = 85,1%, higher than the bar's 80,7% net segment, because
    // part of the net does not come from the RAL. The copy has to say so.
    const insight = screen.getByText(/equivale a circa/i)

    expect(insight).toHaveTextContent('85,1%')
    expect(insight).toHaveTextContent(/includendo la somma non imponibile/i)
    expect(screen.queryByText(/ti resta circa/i)).not.toBeInTheDocument()
  })

  it('recalculates the average payment when the frequency changes', async () => {
    render(<App />)
    const user = await calculate('40000')

    await user.click(screen.getByRole('radio', { name: '12' }))

    // 27.960 / 12 = 2.330
    expect(screen.getByText('2.330 €')).toBeInTheDocument()
    expect(screen.getAllByText('27.960 €').length).toBeGreaterThan(0)
  })

  it('flags the result as outdated when the salary changes', async () => {
    render(<App />)
    const user = await calculate('40000')

    await user.type(screen.getByLabelText(/retribuzione annua lorda/i), '0')

    expect(screen.getByRole('status')).toHaveTextContent(/premi «calcola il netto»/i)
  })

  it('separates contributions from taxes in the breakdown', async () => {
    render(<App />)
    await calculate('40000')

    const breakdown = screen.getByRole('region', { name: /lordi a .* netti/i })

    // Contributions are their own line, never merged into "taxes".
    expect(within(breakdown).getByText('Contributi previdenziali')).toBeVisible()
    expect(within(breakdown).getAllByText('Totale imposte')[0]).toBeVisible()
    expect(within(breakdown).queryByText(/^tasse$/i)).not.toBeInTheDocument()
  })

  it('keeps the essential breakdown to a single explanation entry point', async () => {
    render(<App />)
    await calculate('40000')

    const breakdown = screen.getByRole('region', { name: /lordi a .* netti/i })
    const visibleTriggers = within(breakdown)
      .getAllByRole('button', { name: /cosa significa/i })
      .filter((trigger) => trigger.closest('details') === null)

    expect(visibleTriggers).toHaveLength(1)
  })

  it('keeps the tax detail collapsed until the user opens it', async () => {
    render(<App />)
    const user = await calculate('40000')

    expect(screen.getByText('Addizionale regionale')).not.toBeVisible()

    await user.click(screen.getByText('Dettaglio imposte'))

    expect(screen.getByText('Addizionale regionale')).toBeVisible()
  })

  it('tidies a valid amount into Italian formatting when the field loses focus', async () => {
    render(<App />)
    await calculate('40000')

    expect(screen.getByLabelText(/retribuzione annua lorda/i)).toHaveValue('40.000')
  })

  it('shows a zero surcharge as "0 €", never as a negative amount', async () => {
    render(<App />)
    // Below the Milan exemption threshold, so the municipal surcharge is zero.
    const user = await calculate('22000')
    await user.click(screen.getByText('Dettaglio imposte'))

    const breakdown = screen.getByRole('region', { name: /lordi a .* netti/i })
    const municipalRow = within(breakdown)
      .getByText('Addizionale comunale')
      .closest('div')

    expect(municipalRow).toHaveTextContent('0 €')
    expect(municipalRow).not.toHaveTextContent('−')
  })

  it('marks the tax-wedge allowance as an addition, not a deduction', async () => {
    render(<App />)
    await calculate('22000')

    const row = screen
      .getByText('Riduzione del cuneo fiscale')
      .closest('dl > div')

    expect(row).toHaveTextContent('+')
    expect(row).not.toHaveTextContent('−')
  })

  it('keeps the composition bar to the RAL and shows the allowance outside it', async () => {
    render(<App />)
    await calculate('22000')

    // The net segment excludes the allowance, so the bar still describes the RAL.
    expect(screen.getByText('Netto dalla RAL')).toBeVisible()
    expect(screen.getByText(/resta fuori dalla barra/i)).toBeVisible()

    const label = screen.getByRole('img', { name: /composizione della ral/i })
    expect(label).toBeInTheDocument()
  })

  it('explains the payment frequency once, in the form', async () => {
    render(<App />)
    await calculate('40000')

    // Stated where the choice is made, not repeated inside the result block.
    const explanations = screen.getAllByText(
      /modificano solo la distribuzione del netto annuale/i,
    )

    expect(explanations).toHaveLength(1)
    expect(explanations[0].closest('form')).not.toBeNull()
  })

  it('reveals an explanation through progressive disclosure', async () => {
    render(<App />)
    const user = await calculate('40000')

    await user.click(screen.getByText('Dettaglio imposte'))

    const trigger = screen.getByRole('button', {
      name: /cosa significa addizionale comunale/i,
    })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await user.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(/soglia di esenzione/i)).toBeVisible()
  })
})

describe('RAL comparison', () => {
  /** Compares against a scenario, assuming a calculation already ran. */
  async function compareWith(user: ReturnType<typeof userEvent.setup>, salary: string) {
    const field = screen.getByLabelText(/nuova ral/i)

    await user.clear(field)
    if (salary !== '') await user.type(field, salary)
    await user.click(screen.getByRole('button', { name: /^confronta$/i }))

    return user
  }

  it('is not offered before a calculation has run', () => {
    render(<App />)

    expect(screen.queryByLabelText(/nuova ral/i)).not.toBeInTheDocument()
  })

  it('shows nothing until a scenario is submitted', async () => {
    render(<App />)
    await calculate('40000')

    expect(screen.getByLabelText(/nuova ral/i)).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('compares upwards and leads with the per-payment insight', async () => {
    render(<App />)
    const user = await calculate('40000')
    await compareWith(user, '45000')

    expect(
      screen.getByRole('heading', { name: /da 40\.000\s€ a 45\.000\s€ di RAL/i }),
    ).toBeInTheDocument()

    // 30.034 − 27.960 = 2.074 a year, 160 a month over 13 payments.
    expect(
      screen.getByText(
        /5\.000\s€ di RAL in più significano circa 160\s€ netti in più per mensilità/i,
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/ogni 100\s€ di RAL di differenza valgono circa 41\s€ di netto/i),
    ).toBeInTheDocument()

    // Per payment, then per year, then the table.
    expect(screen.getByText(/\+ 2\.074\s€ netti all’anno/)).toBeInTheDocument()
  })

  it('compares downwards just as well', async () => {
    render(<App />)
    const user = await calculate('40000')
    await compareWith(user, '35000')

    expect(
      screen.getByRole('heading', { name: /da 40\.000\s€ a 35\.000\s€ di RAL/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/di RAL in meno significano/i)).toHaveTextContent(
      /netti in meno per mensilità/i,
    )
  })

  it('puts the figures in an accessible table', async () => {
    render(<App />)
    const user = await calculate('40000')
    await compareWith(user, '45000')

    const table = within(screen.getByRole('table'))

    expect(table.getByRole('columnheader', { name: 'Oggi' })).toBeInTheDocument()
    expect(
      table.getByRole('columnheader', { name: 'Nuova RAL' }),
    ).toBeInTheDocument()
    expect(
      table.getByRole('rowheader', { name: 'Netto annuale' }),
    ).toBeInTheDocument()
    expect(table.getByText('+ 2.074 €')).toBeInTheDocument()
  })

  it('updates both scenarios when the payment frequency changes', async () => {
    render(<App />)
    const user = await calculate('40000')
    await compareWith(user, '45000')

    expect(
      within(screen.getByRole('table')).getByRole('rowheader', {
        name: 'Netto medio × 13',
      }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: '12' }))

    const table = within(screen.getByRole('table'))
    expect(
      table.getByRole('rowheader', { name: 'Netto medio × 12' }),
    ).toBeInTheDocument()
    // 30.034 / 12 = 2.503 against 27.960 / 12 = 2.330.
    expect(table.getByText('2.503 €')).toBeInTheDocument()
    expect(table.getByText('2.330 €')).toBeInTheDocument()
  })

  it('refuses a scenario identical to the current RAL', async () => {
    render(<App />)
    const user = await calculate('40000')
    await compareWith(user, '40000')

    expect(screen.getByRole('alert')).toHaveTextContent(
      /è la stessa ral del calcolo principale/i,
    )
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.getByLabelText(/nuova ral/i)).toHaveAttribute(
      'aria-invalid',
      'true',
    )
  })

  it.each([
    ['', /inserisci la ral da confrontare/i],
    ['abc', /solo cifre/i],
    ['0', /maggiore di zero/i],
  ])('rejects %s with an accessible error', async (input, message) => {
    render(<App />)
    const user = await calculate('40000')
    await compareWith(user, input)

    expect(screen.getByRole('alert')).toHaveTextContent(message)
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('says so when a higher RAL produces a lower net', async () => {
    render(<App />)
    const user = await calculate('25200')
    await compareWith(user, '25500')

    // The explanation names the rule, it does not just say "a threshold".
    const explanation = screen.getByText(/addizionale comunale di Milano/i)
    expect(explanation).toHaveTextContent(/23\.000\s€ di imponibile/)
    expect(explanation).toHaveTextContent(
      /si applica all’intero imponibile e non solo alla parte eccedente/i,
    )
    expect(explanation).toHaveTextContent(/riduzione temporanea del netto/i)

    // The per-payment delta rounds to zero here, so the headline falls back to
    // the annual figure rather than saying "circa 0 € netti in meno".
    const headline = screen.getByText(/di RAL in più significano/i)
    expect(headline).toHaveTextContent(/netti in meno all’anno/i)
    expect(headline).not.toHaveTextContent(/circa 0\s€/)
  })

  it('drops the comparison when the main RAL becomes the compared one', async () => {
    render(<App />)
    const user = await calculate('40000')
    await compareWith(user, '45000')

    expect(screen.getByRole('table')).toBeInTheDocument()

    await calculate('45000')

    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('keeps the comparison in step with a new baseline', async () => {
    render(<App />)
    const user = await calculate('40000')
    await compareWith(user, '45000')

    await calculate('50000')

    // The scenario is derived, so it follows the new baseline instead of
    // showing a comparison against a salary that is no longer on screen.
    expect(
      screen.getByRole('heading', { name: /da 50\.000\s€ a 45\.000\s€ di RAL/i }),
    ).toBeInTheDocument()
  })
})

import { useId } from 'react'

import styles from './SegmentedControl.module.css'

type SegmentedControlOption<TValue extends string | number> = {
  value: TValue
  label: string
}

type SegmentedControlProps<TValue extends string | number> = {
  legend: string
  hint?: string
  options: ReadonlyArray<SegmentedControlOption<TValue>>
  value: TValue
  onChange: (value: TValue) => void
}

/**
 * Radio group styled as a segmented control.
 *
 * Built on native radio inputs so keyboard navigation, grouping and screen
 * reader semantics come for free.
 */
export function SegmentedControl<TValue extends string | number>({
  legend,
  hint,
  options,
  value,
  onChange,
}: SegmentedControlProps<TValue>) {
  const groupName = useId()
  const hintId = useId()

  return (
    <fieldset className={styles.fieldset} aria-describedby={hint ? hintId : undefined}>
      <legend className={styles.legend}>{legend}</legend>

      <div className={styles.options}>
        {options.map((option) => {
          const optionId = `${groupName}-${option.value}`

          return (
            <div key={option.value} className={styles.option}>
              <input
                type="radio"
                id={optionId}
                name={groupName}
                className={styles.input}
                value={option.value}
                checked={option.value === value}
                onChange={() => onChange(option.value)}
              />
              <label htmlFor={optionId} className={styles.label}>
                {option.label}
              </label>
            </div>
          )
        })}
      </div>

      {hint ? (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      ) : null}
    </fieldset>
  )
}

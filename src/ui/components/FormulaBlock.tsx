import type { Formula } from '../../sim/content/schema'
import { Math } from './Math'

/** The formula and a table that explains every symbol in it. */
export function FormulaBlock({ formula }: { formula: Formula }) {
  return (
    <div data-testid="formula" className="formula-block">
      <Math latex={formula.latex} display />
      <table aria-label="What each symbol means" className="symbol-table">
        <thead>
          <tr>
            <th scope="col">Symbol</th>
            <th scope="col">Meaning</th>
          </tr>
        </thead>
        <tbody>
          {formula.symbols.map((s) => (
            <tr key={s.symbol}>
              <td>
                <Math latex={s.symbol} />
              </td>
              <td>{s.meaning}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

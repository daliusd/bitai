import { useState } from 'react';
import type { FormEvent } from 'react';
import { MONTHS, declineName } from './lib/lt';
import { startDay } from './lib/schedule';
import { generatePdf, saveBlob } from './lib/download';

interface Props {
  generate?: typeof generatePdf;
  save?: typeof saveBlob;
  today?: Date;
}

export default function App({ generate = generatePdf, save = saveBlob, today = new Date() }: Props) {
  const [name, setName] = useState('');
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const trimmed = name.trim();
  const validYear = Number.isInteger(year) && year >= 2000 && year <= 2100;
  const start = startDay(year, month, today);
  const title = trimmed ? `${declineName(trimmed).genitive} priežiūros kalendorius` : 'Žiurkėno priežiūros kalendorius';

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!trimmed || !validYear || busy) return;
    setBusy(true);
    setError('');
    try {
      const { blob, fileName } = await generate({ name: trimmed, year, month, start });
      save(blob, fileName);
    } catch (err) {
      console.error(err);
      setError('Nepavyko paruošti PDF. Pabandykite dar kartą.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <nav className="crumbs">
        <a href="/">bitai</a> / žiurkėno kalendorius
      </nav>
      <main className="card">
        <header>
          <img src={`${import.meta.env.BASE_URL}art/hamster.png`} alt="" width="96" height="96" />
          <div>
            <h1>Žiurkėno kalendorius</h1>
            <p>Spausdinamas mėnesio lapas vaikui: vanduo, maistas, narvo valymas ir žaidimai. Kai darbas atliktas – pažymi langelį.</p>
          </div>
        </header>

        <form onSubmit={onSubmit}>
          <label className="field">
            <span>Žiurkėno vardas</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="pvz., Pupelė"
              maxLength={40}
              autoComplete="off"
              required
              autoFocus
            />
          </label>
          <div className="row">
            <label className="field">
              <span>Metai</span>
              <input
                type="number"
                inputMode="numeric"
                min={2000}
                max={2100}
                value={Number.isNaN(year) ? '' : year}
                onChange={(e) => setYear(e.target.valueAsNumber)}
                required
              />
            </label>
            <label className="field">
              <span>Mėnuo</span>
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className="preview" aria-live="polite">
            Antraštė: <b>{title}</b>
            {start > 1 && (
              <>
                <br />
                Langeliai prasidės nuo šiandien ({start} d.).
              </>
            )}
          </p>

          <button type="submit" disabled={!trimmed || !validYear || busy}>
            {busy ? 'Ruošiama…' : 'Generuoti PDF'}
          </button>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </form>
      </main>
      <footer className="note">
        PDF sukuriamas jūsų naršyklėje – niekas niekur nesiunčiama. Spausdinkite A4 lape.
      </footer>
    </div>
  );
}

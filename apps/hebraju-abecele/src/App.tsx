import { useCallback, useEffect, useMemo, useState } from 'react';
import { CARDS, DECKS, cardsFor, type Card, type DeckId } from './lib/cards';
import { grade, isLearned, pickNext, type Weights } from './lib/practice';
import { usePersistentState } from './lib/storage';
import { ALL_STYLES, STYLES, isStyleList, type StyleId } from './lib/styles';

interface Props {
  random?: () => number;
}

const ALL_DECKS: DeckId[] = DECKS.map((d) => d.id);

function isDeckList(v: unknown): v is DeckId[] {
  return Array.isArray(v) && v.every((d) => ALL_DECKS.includes(d));
}

export default function App({ random = Math.random }: Props) {
  const [storedDecks, setDecks] = usePersistentState<DeckId[]>('decks', ['raides']);
  const decks: DeckId[] = isDeckList(storedDecks) ? storedDecks : ['raides'];
  const [storedStyles, setStyles] = usePersistentState<StyleId[]>('styles', ['knyginis']);
  const styles: StyleId[] = isStyleList(storedStyles) ? storedStyles : ['knyginis'];
  const [weights, setWeights] = usePersistentState<Weights>('weights', {});
  const [session, setSession] = useState({ known: 0, unknown: 0 });

  const decksKey = decks.join(',');
  const pool = useMemo(() => cardsFor(decksKey.split(',') as DeckId[]), [decksKey]);
  const poolIds = useMemo(() => pool.map((c) => c.id), [pool]);

  const [currentId, setCurrentId] = useState<string | null>(() => pickNext(poolIds, weights, null, random));
  const [flipped, setFlipped] = useState(false);
  // Changes on every new card so the card remounts unflipped, without a flip-back animation.
  const [turn, setTurn] = useState(0);

  const current: Card | undefined = pool.find((c) => c.id === currentId);

  // A deck was switched off under the current card: draw a new one from the remaining decks.
  useEffect(() => {
    if (!current) {
      setCurrentId(pickNext(poolIds, weights, null, random));
      setFlipped(false);
      setTurn((t) => t + 1);
    }
  }, [current, poolIds, weights, random]);

  const answer = useCallback(
    (known: boolean) => {
      if (!current) return;
      const next = grade(weights, current.id, known);
      setWeights(next);
      setSession((s) => (known ? { ...s, known: s.known + 1 } : { ...s, unknown: s.unknown + 1 }));
      setCurrentId(pickNext(poolIds, next, current.id, random));
      setFlipped(false);
      setTurn((t) => t + 1);
    },
    [current, weights, poolIds, random, setWeights],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const el = e.target as HTMLElement | null;
      const interactive = el?.closest('button, input, a, select, textarea');
      if ((e.key === ' ' || e.key === 'Enter') && !interactive) {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === 'ArrowLeft') {
        answer(false);
      } else if (e.key === 'ArrowRight') {
        answer(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [answer]);

  function toggleDeck(id: DeckId) {
    const next = decks.includes(id) ? decks.filter((d) => d !== id) : ALL_DECKS.filter((d) => d === id || decks.includes(d));
    setDecks(next);
  }

  function toggleStyle(id: StyleId) {
    if (styles.includes(id)) {
      if (styles.length > 1) setStyles(styles.filter((s) => s !== id));
    } else {
      setStyles(ALL_STYLES.filter((s) => s === id || styles.includes(s)));
    }
  }

  function resetProgress() {
    setWeights({});
    setSession({ known: 0, unknown: 0 });
  }

  const learned = pool.filter((c) => isLearned(weights, c.id)).length;
  const anyProgress = CARDS.some((c) => weights[c.id] !== undefined);

  return (
    <div className="page">
      <header className="masthead">
        <p className="crumbs">
          <a href="/">bitai</a> / hebrajų abėcėlė
        </p>
        <h1>Hebrajų abėcėlė</h1>
        <p className="lede">
          Kortelėje – hebrajiška raidė, balsė arba skiemuo. Pabandykite perskaityti, spustelėkite kortelę ir pažiūrėkite
          lietuvišką transkripciją. Ko nežinojote, tas pasirodys dažniau.
        </p>
      </header>

      <main>
        <fieldset className="decks">
          <legend>Ką mokytis</legend>
          {DECKS.map((d) => (
            <label key={d.id} className="deck">
              <input type="checkbox" checked={decks.includes(d.id)} onChange={() => toggleDeck(d.id)} />
              <span className="deck-label">{d.label}</span>
              <span className="deck-desc">{d.description}</span>
            </label>
          ))}
        </fieldset>

        <fieldset className="decks">
          <legend>Raidžių stilius</legend>
          {STYLES.map((st) => (
            <label key={st.id} className="deck">
              <input
                type="checkbox"
                checked={styles.includes(st.id)}
                disabled={styles.length === 1 && styles.includes(st.id)}
                onChange={() => toggleStyle(st.id)}
              />
              <span className={`deck-label style-sample style-${st.id}`} lang="he" dir="rtl">
                אבג
              </span>
              <span className="deck-label">{st.label}</span>
              <span className="deck-desc">{st.description}</span>
            </label>
          ))}
        </fieldset>

        {current ? (
          <>
            <div className="stage">
              <button
                key={turn}
                type="button"
                className={`card${flipped ? ' is-flipped' : ''}`}
                onClick={() => setFlipped((f) => !f)}
                aria-label={flipped ? 'Kortelė atversta, spustelėkite, kad apverstumėte atgal' : 'Apversti kortelę'}
                aria-pressed={flipped}
              >
                <span className="card-inner">
                  <span className="face front">
                    <span className={`variants count-${styles.length}`}>
                      {STYLES.filter((st) => styles.includes(st.id)).map((st) => (
                        <span key={st.id} className="variant">
                          <span className={`hebrew style-${st.id}`} lang="he" dir="rtl">
                            {current.hebrew}
                          </span>
                          {styles.length > 1 && <span className="variant-label">{st.label}</span>}
                        </span>
                      ))}
                    </span>
                  </span>
                  <span className="face back" aria-live="polite">
                    {flipped && (
                      <>
                        <span className="all-styles" aria-label="Visi stiliai">
                          {STYLES.map((st) => (
                            <span
                              key={st.id}
                              className={`style-${st.id}${styles.includes(st.id) ? ' is-current' : ''}`}
                              lang="he"
                              dir="rtl"
                              title={st.label}
                            >
                              {current.hebrew}
                            </span>
                          ))}
                        </span>
                        {current.sound ? (
                          <span className="sound">{current.sound}</span>
                        ) : (
                          <span className="sound silent">tylioji</span>
                        )}
                        <span className="name">{current.name}</span>
                        {current.hint && <span className="hint">{current.hint}</span>}
                      </>
                    )}
                  </span>
                </span>
              </button>
            </div>

            <div className="answers">
              <button type="button" className="btn btn-miss" onClick={() => answer(false)}>
                Nežinojau
              </button>
              <button type="button" className="btn btn-hit" onClick={() => answer(true)}>
                Žinojau
              </button>
            </div>
            <p className="keys">
              Spustelėkite kortelę, kad ją apverstumėte (tarpo klavišas). Klaviatūra: ← nežinojau, → žinojau.
            </p>
          </>
        ) : (
          <p className="empty">Pasirinkite bent vieną rinkinį.</p>
        )}

        <section className="progress" aria-label="Pažanga">
          <div className="meter" aria-hidden="true">
            <span style={{ width: pool.length ? `${(learned / pool.length) * 100}%` : 0 }} />
          </div>
          <p>
            Išmokta <strong>{learned}</strong> iš {pool.length}
            {session.known + session.unknown > 0 && (
              <>
                {' '}
                · šįkart žinojote {session.known}, nežinojote {session.unknown}
              </>
            )}
          </p>
          {anyProgress && (
            <button type="button" className="link-button" onClick={resetProgress}>
              Pradėti iš naujo
            </button>
          )}
        </section>
      </main>

      <footer className="colophon">
        <p>
          Tarimas – šiuolaikinės hebrajų (Izraelio) kalbos. Kortelė laikoma išmokta, kai ją kelis kartus iš eilės žinote.
          Pažanga saugoma tik šioje naršyklėje.
        </p>
      </footer>
    </div>
  );
}

import { useState } from 'react'
import { FAQ } from '../seo'
import { Plus } from './Icons'

/** FAQ accordion. Answers stay in the DOM (collapsed visually) so crawlers can read them. */
export function Faq() {
  const [open, setOpen] = useState(0)
  return (
    <section className="faq" id="faq" aria-labelledby="faq-title">
      <div className="faq__head">
        <p className="kicker reveal">FAQ</p>
        <h2 id="faq-title" className="reveal">
          Questions, <em>Answered</em>
        </h2>
        <p className="lead reveal">
          Everything people usually ask before running Danger Detection. More detail lives in the{' '}
          <a href="#/docs">documentation</a>.
        </p>
      </div>

      <dl className="faq__list">
        {FAQ.map((f, i) => {
          const isOpen = open === i
          return (
            <div className={`faq__item reveal ${isOpen ? 'is-open' : ''}`} key={f.q} style={{ transitionDelay: `${i * 60}ms` }}>
              <dt>
                <button aria-expanded={isOpen} aria-controls={`faq-a-${i}`} onClick={() => setOpen(isOpen ? -1 : i)}>
                  <span className="faq__num">0{i + 1}</span>
                  <span className="faq__q">{f.q}</span>
                  <span className="faq__icon" aria-hidden>
                    <Plus size={18} />
                  </span>
                </button>
              </dt>
              <dd id={`faq-a-${i}`} className="faq__a">
                <div>
                  <p>{f.a}</p>
                </div>
              </dd>
            </div>
          )
        })}
      </dl>
    </section>
  )
}

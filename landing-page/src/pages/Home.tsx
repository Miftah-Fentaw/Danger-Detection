import { useRevealOnScroll } from '../hooks'
import { Hero } from '../components/Hero'
import { Statement } from '../components/Statement'
import { Features } from '../components/Features'
import { HowItWorks } from '../components/HowItWorks'
import { UseCases } from '../components/UseCases'
import { QuickStart } from '../components/QuickStart'
import { CTA } from '../components/Footer'
import { Faq } from '../components/Faq'
import { usePageMeta } from '../meta'
import { DESCRIPTION, TITLE } from '../seo'

export function Home() {
  useRevealOnScroll('home')
  usePageMeta(TITLE, DESCRIPTION)
  return (
    <>
      <Hero />
      <Statement />
      <Features />
      <HowItWorks />
      <UseCases />
      <QuickStart />
      <Faq />
      <CTA />
    </>
  )
}

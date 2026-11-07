import type { HazardKind } from './api'

export type ActiveAlert = {
  id: string
  kind: HazardKind
  fire: number
  smoke: number
  ts: number
  source: string
  acknowledged: boolean
  /** Local test alert from Settings; never sent to the server. */
  preview?: boolean
}

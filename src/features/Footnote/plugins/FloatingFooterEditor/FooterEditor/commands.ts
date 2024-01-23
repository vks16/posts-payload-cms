import type { LexicalCommand } from 'lexical'

import { createCommand } from 'lexical'

import type { FooterPayload } from '../types'

export const TOGGLE_FOOTER_WITH_MODAL_COMMAND: LexicalCommand<FooterPayload | null> = createCommand(
  'TOGGLE_FOOTER_WITH_MODAL_COMMAND',
)

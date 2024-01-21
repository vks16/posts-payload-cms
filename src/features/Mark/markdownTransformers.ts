import type { TextFormatTransformer } from '@lexical/markdown'

export const MARK: TextFormatTransformer = {
  format: ['strikethrough'],
  tag: '==',
  type: 'text-format',
}

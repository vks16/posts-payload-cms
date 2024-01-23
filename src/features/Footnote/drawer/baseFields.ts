import type { Config } from 'payload/config'
import type { Field } from 'payload/types'

import { extractTranslations } from 'payload/utilities'

const translations = extractTranslations([
  'fields:textToDisplay',
  'fields:linkType',
  'fields:chooseBetweenCustomTextOrDocument',
  'fields:customURL',
  'fields:internalLink',
  'fields:enterURL',
  'fields:chooseDocumentToLink',
  'fields:openInNewTab',
])

export const getBaseFields = (
  config: Config,
  enabledCollections: false | string[],
  disabledCollections: false | string[],
): Field[] => {
  let enabledRelations: string[]

  /**
   * Figure out which relations should be enabled (enabledRelations) based on a collection's admin.enableRichTextLink property,
   * or the Link Feature's enabledCollections and disabledCollections properties which override it.
   */
  if (enabledCollections) {
    enabledRelations = enabledCollections
  } else if (disabledCollections) {
    enabledRelations = config.collections
      .filter(({ slug }) => !disabledCollections.includes(slug))
      .map(({ slug }) => slug)
  } else {
    enabledRelations = config.collections
      .filter(({ admin: { enableRichTextLink, hidden } }) => {
        if (typeof hidden !== 'function' && hidden) {
          return false
        }
        return enableRichTextLink
      })
      .map(({ slug }) => slug)
  }

  const baseFields = [
    {
      name: 'content',
      label: translations['fields:textToDisplay'],
      required: true,
      type: 'text',
    }
  ]

 

  return baseFields as Field[]
}

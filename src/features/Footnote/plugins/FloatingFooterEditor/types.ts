import type { FooterFields } from '../../nodes/FooterNode'

/**
 * The payload of a link node
 * This can be delivered from the link node to the drawer, or from the drawer/anything to the TOGGLE_LINK_COMMAND
 */
export type FooterPayload = {
  content: unknown
}

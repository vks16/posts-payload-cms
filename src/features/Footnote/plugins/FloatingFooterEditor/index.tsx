'use client'
import * as React from 'react'
import { createPortal } from 'react-dom'

import './index.scss'
import FooterEditor from './FooterEditor'

export const FloatingFooterEditorPlugin: React.FC<
  {
    anchorElem: HTMLElement
  } 
> = (props) => {
  const { anchorElem = document.body } = props

  return createPortal(<FooterEditor {...props} anchorElem={anchorElem} />, anchorElem)
}

import { Drawer } from 'payload/components/elements'
import { Form } from 'payload/components/forms'
import { RenderFields } from 'payload/components/forms'
import { FormSubmit } from 'payload/components/forms'
import { fieldTypes } from 'payload/components/forms'
import React from 'react'

import './index.scss'
import { type Props } from './types'

const baseClass = 'lexical-footer-content-drawer'

export const FooterDrawer: React.FC<Props> = ({
  drawerSlug,
  fieldSchema,
  handleModalSubmit,
  initialState,
}) => {
  return (
    <Drawer className={baseClass} slug={drawerSlug} title="Footer Content">
      <Form fields={fieldSchema} initialState={initialState} onSubmit={handleModalSubmit}>
        <RenderFields
          fieldSchema={fieldSchema}
          fieldTypes={fieldTypes}
          forceRender
          readOnly={false}
        />
        <FormSubmit>Submit</FormSubmit>
      </Form>
    </Drawer>
  )
}

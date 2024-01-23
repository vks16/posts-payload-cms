"use client";
import type { Data, Fields, Field } from "payload/types";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";

import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  KEY_ESCAPE_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import {
  buildStateFromSchema,
  useConfig,
  useDocumentInfo,
  useEditDepth,
} from "payload/components/utilities";
import { formatDrawerSlug } from "payload/components/elements";
import { useModal } from "@faceless-ui/modal";
import {
  $isFooterNode,
  FooterNode,
  TOGGLE_FOOTER_COMMAND,
} from "../../../nodes/FooterNode";
import { FooterPayload } from "../types";
import { TOGGLE_FOOTER_WITH_MODAL_COMMAND } from "./commands";
import { FooterDrawer } from "../../../drawer";
import {
  BoldTextFeature,
  convertLexicalToHTML,
  defaultHTMLConverters,
  ItalicTextFeature,
  lexicalEditor,
  LinkFeature,
  ParagraphFeature,
  StrikethroughTextFeature,
} from "@payloadcms/richtext-lexical";

import {
  getSelectedNode,
  setFloatingElemPositionForLinkEditor as setFloatingElemPositionForFooterEditor,
  useEditorConfigContext,
} from "@payloadcms/richtext-lexical";

function FooterEditor({
  anchorElem,
}: {
  anchorElem: HTMLElement;
}): JSX.Element {
  const [editor] = useLexicalComposerContext();

  const editorRef = useRef<HTMLDivElement | null>(null);
  const [contentHTML, setContentHtml] = useState<string>("");
  const { uuid } = useEditorConfigContext();
  const config = useConfig();
  const { getDocPreferences } = useDocumentInfo();
  const [initialState, setInitialState] = useState<Fields>({});
  const [fieldSchema] = useState<Field[]>(() => {
    return [
      {
        name: "content",
        type: "richText",
        editor: lexicalEditor({
          features: [
            BoldTextFeature(),
            ItalicTextFeature(),
            StrikethroughTextFeature(),
            ParagraphFeature(),
            LinkFeature({}),
          ],
        }),
      },
    ];
  });
  const editDepth = useEditDepth();
  const [isFooter, setIsFooter] = useState(false);
  const { closeModal, toggleModal } = useModal();

  const drawerSlug = formatDrawerSlug({
    depth: editDepth,
    slug: `lexical-rich-text-footer-` + uuid,
  });

  const updateFooterEditor = useCallback(async () => {
    const selection = $getSelection();
    let selectedNodeDomRect: DOMRect | undefined = null;

    // Handle the data displayed in the floating footer content editor & drawer when we click on footer node
    if ($isRangeSelection(selection)) {
      const node = getSelectedNode(selection).getParent().getLastChild();
      selectedNodeDomRect = editor
        .getElementByKey(node.getKey())
        ?.getBoundingClientRect();

      const selectedFooterNode: FooterNode | null = $isFooterNode(node)
        ? node
        : null;

      if (selectedFooterNode === null) {
        setIsFooter(false);
        setInitialState({});
        return;
      }

      convertLexicalToHTML({
        converters: defaultHTMLConverters,
        data: selectedFooterNode.getFields().content,
      }).then((res) => setContentHtml(res));

      // Initial state:
      const data: FooterPayload = {
        content: selectedFooterNode.getFields().content,
      };
      // Set initial state of the drawer. This will basically pre-fill the drawer fields with the
      // values saved in the footer node you clicked on.
      const preferences = await getDocPreferences();
      const state = await buildStateFromSchema({
        config,
        data,
        fieldSchema,

        operation: "create",
        preferences,
        locale: "",
        t: undefined,
      });
      setInitialState(state);
      setIsFooter(true);
    }

    const editorElem = editorRef.current;
    const nativeSelection = window.getSelection();
    const { activeElement } = document;

    if (editorElem === null) {
      return;
    }
    const rootElement = editor.getRootElement();

    if (
      selection !== null &&
      nativeSelection !== null &&
      rootElement !== null &&
      rootElement.contains(nativeSelection.anchorNode)
    ) {
      if (!selectedNodeDomRect) {
        selectedNodeDomRect = nativeSelection
          .getRangeAt(0)
          .getBoundingClientRect();
      }
      
      if (selectedNodeDomRect !== null) {
        selectedNodeDomRect.y += 40;
        setFloatingElemPositionForFooterEditor(
          selectedNodeDomRect,
          editorElem,
          anchorElem
        );
      } else if (
        activeElement == null ||
        activeElement.className !== "footer-content"
      ) {
        if (rootElement !== null) {
          setFloatingElemPositionForFooterEditor(null, editorElem, anchorElem);
        }
      }
    }
    return true;
  }, [anchorElem, editor, fieldSchema, config, getDocPreferences]);

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        TOGGLE_FOOTER_WITH_MODAL_COMMAND,
        () => {
          // Now, open the modal
          updateFooterEditor()
            .then(() => {
              toggleModal(drawerSlug);
            })
            .catch((error) => {
              throw error;
            });
          return true;
        },
        COMMAND_PRIORITY_LOW
      )
    );
  }, [editor, updateFooterEditor, toggleModal, drawerSlug]);

  useEffect(() => {
    if (!isFooter && editorRef) {
      editorRef.current.style.opacity = "0";
      editorRef.current.style.transform = "translate(-10000px, -10000px)";
    }
  }, [isFooter]);

  useEffect(() => {
    const scrollerElem = anchorElem.parentElement;

    const update = (): void => {
      editor.getEditorState().read(() => {
        void updateFooterEditor();
      });
    };

    window.addEventListener("resize", update);

    if (scrollerElem != null) {
      scrollerElem.addEventListener("scroll", update);
    }

    return () => {
      window.removeEventListener("resize", update);

      if (scrollerElem != null) {
        scrollerElem.removeEventListener("scroll", update);
      }
    };
  }, [anchorElem.parentElement, editor, updateFooterEditor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          void updateFooterEditor();
        });
      }),

      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          void updateFooterEditor();
          return true;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        () => {
          if (isFooter) {
            setIsFooter(false);
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_HIGH
      )
    );
  }, [editor, updateFooterEditor, setIsFooter, isFooter]);

  useEffect(() => {
    editor.getEditorState().read(() => {
      void updateFooterEditor();
    });
  }, [editor, updateFooterEditor]);
  return (
    <React.Fragment>
      <div className="footer-editor" ref={editorRef}>
        <div className="footer-content">
          <div dangerouslySetInnerHTML={{ __html: contentHTML }} />

          {editor.isEditable() && (
            <>
              <button
                aria-label="Edit footer"
                className="footer-edit"
                onClick={() => {
                  toggleModal(drawerSlug);
                }}
                onMouseDown={(event) => {
                  event.preventDefault();
                }}
                tabIndex={0}
                type="button"
              />
              <button
                aria-label="Remove footer"
                className="footer-trash"
                onClick={() => {
                  editor.dispatchCommand(TOGGLE_FOOTER_COMMAND, null);
                }}
                onMouseDown={(event) => {
                  event.preventDefault();
                }}
                tabIndex={0}
                type="button"
              />
            </>
          )}
        </div>
      </div>
      <FooterDrawer
        drawerSlug={drawerSlug}
        fieldSchema={fieldSchema}
        handleModalSubmit={(fields: Fields, data: Data) => {
          closeModal(drawerSlug);
          const newFooterPayload: FooterPayload = data as FooterPayload;
          convertLexicalToHTML({
            converters: defaultHTMLConverters,
            data: data.content,
          }).then((res) => setContentHtml(res));

          editor.dispatchCommand(TOGGLE_FOOTER_COMMAND, newFooterPayload);
        }}
        initialState={initialState}
      />
    </React.Fragment>
  );
}

export default FooterEditor;

"use client";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import {
  COMMAND_PRIORITY_LOW,
} from "lexical";
import { useEffect } from "react";

import {
  TOGGLE_FOOTER_COMMAND,
  FooterNode,
  toggleFooter,
} from "../../nodes/FooterNode";
import { FooterPayload } from "../FloatingFooterEditor/types";

export function FooterPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([FooterNode])) {
      throw new Error("FooterPlugin: FooterNode not registered on editor");
    }
    return mergeRegister(
      editor.registerCommand(
        TOGGLE_FOOTER_COMMAND,
        (payload: FooterPayload) => {
          toggleFooter(payload);
          return true;
        },
        COMMAND_PRIORITY_LOW
      ),
      () => {
      }
    );
  }, [editor]);

  return null;
}

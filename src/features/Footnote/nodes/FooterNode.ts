import type { BaseSelection } from "lexical";

import { addClassNamesToElement } from "@lexical/utils";
import {
  $applyNodeReplacement,
  $isTextNode,
  $createParagraphNode,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  type DOMConversionMap,
  type DOMConversionOutput,
  type EditorConfig,
  ElementNode,
  type LexicalCommand,
  type LexicalNode,
  type NodeKey,
  type RangeSelection,
  type SerializedElementNode,
  type Spread,
  createCommand,
} from "lexical";
import { FooterPayload } from "../plugins/FloatingFooterEditor/types";
import {
  convertLexicalToHTML,
  defaultHTMLConverters,
} from "@payloadcms/richtext-lexical";

export const FOOTER_ID_CONST = "footernote-";
export type FooterFields = {
  id: string;
  count: number;
  label: string;
  content: any;
};

export type SerializedFooterNode = Spread<
  {
    fields: FooterFields;
  },
  SerializedElementNode
>;

/** @noInheritDoc */
export class FooterNode extends ElementNode {
  __fields: FooterFields;

  constructor({ fields, key }: { fields: FooterFields; key?: NodeKey }) {
    super(key);
    this.__fields = fields;
  }

  static COUNT = 0;
  static clone(node: FooterNode): FooterNode {
    return new FooterNode({
      fields: node.__fields,
      key: node.__key,
    });
  }

  static getType(): string {
    return "footernote";
  }

  static importJSON(serializedNode: SerializedFooterNode): FooterNode {
    const node = $createFooterNode({
      payload: serializedNode.fields,
    });
    node.setFormat(serializedNode.format);
    node.setIndent(serializedNode.indent);
    node.setDirection(serializedNode.direction);
    return node;
  }

  canBeEmpty(): false {
    return false;
  }

  canInsertTextAfter(): false {
    return false;
  }

  canInsertTextBefore(): false {
    return false;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const supscript = document.createElement("sup");
    const idElem = document.createElement("a");
    const footers = document.getElementsByTagName("footer");

    const footerElem =
      footers.length > 0 ? footers[0] : document.createElement("footer");
    const footerChild = footerElem.firstChild;
    let ul;
    if (footerChild !== null) {
      ul = footerChild;
    } else {
      ul = document.createElement("ul");
      footerElem.appendChild(ul);
    }
    const li = document.createElement("li");

    idElem.textContent = this.__fields.label;
    convertLexicalToHTML({
      converters: defaultHTMLConverters,
      data: this.__fields.content,
    })
      .then((res) => {
        li.innerHTML = res;
        li.setAttribute("id", this.__fields.id);
      })
      .catch((err) => console.error(err.message));
    ul.appendChild(li);
    supscript.appendChild(idElem);

    addClassNamesToElement(supscript, config.theme.link);
    return supscript;
  }

  exportJSON(): SerializedFooterNode {
    return {
      ...super.exportJSON(),
      fields: this.getFields(),
      type: this.getType(),
      version: 2,
    };
  }

  extractWithChild(
    child: LexicalNode,
    selection: BaseSelection,
    destination: "clone" | "html"
  ): boolean {
    if (!$isRangeSelection(selection)) {
      return false;
    }

    const anchorNode = selection.anchor.getNode();
    const focusNode = selection.focus.getNode();

    return (
      this.isParentOf(anchorNode) &&
      this.isParentOf(focusNode) &&
      selection.getTextContent().length > 0
    );
  }

  getFields(): FooterFields {
    return this.getLatest().__fields;
  }

  insertNewAfter(
    selection: RangeSelection,
    restoreSelection = true
  ): ElementNode | null {
    const element = this.getParentOrThrow().insertNewAfter(
      selection,
      restoreSelection
    );
    if ($isElementNode(element)) {
      const footerNode = $createFooterNode({ payload: this.__fields });
      element.append(footerNode);
      return footerNode;
    }
    return null;
  }

  isInline(): true {
    return true;
  }

  setFields(fields: FooterFields): void {
    const writable = this.getWritable();
    writable.__fields = fields;
  }

  updateDOM(
    prevNode: FooterNode,
    dom: HTMLElement,
    config: EditorConfig
  ): boolean {
    return false;
  }
}

export function $createFooterNode({
  payload,
}: {
  payload: FooterPayload;
}): FooterNode {
  const count = ++FooterNode.COUNT;
  const label = count.toString();
  const id = `${FOOTER_ID_CONST}${count}`;

  const fields: FooterFields = {
    count,
    label,
    id,
    ...payload,
  };
  return $applyNodeReplacement(new FooterNode({ fields }));
}

export function $isFooterNode(
  node: LexicalNode | null | undefined
): node is FooterNode {
  return node instanceof FooterNode;
}

export const TOGGLE_FOOTER_COMMAND: LexicalCommand<FooterPayload | null> =
  createCommand("TOGGLE_FOOTER_COMMAND");

export function toggleFooter(payload: FooterPayload): void {
  const selection = $getSelection();

  if (!$isRangeSelection(selection)) {
    return;
  }
  const nodes = selection.extract();
  if (payload === null) {
    // Remove footerNodes
    const lastNode = nodes[0].getParent().getLastChild();
    if($isFooterNode(lastNode)){
      lastNode.remove()
    }
  } else {
    if (nodes.length === 1) {
      const selectedNode = nodes[0].getParent().getChildren().find(e => $isFooterNode(e));
      // if the selected node is a FooterNode or if its parent is a FooterNode
      // we update the content
      const footerNode: FooterNode | null = $isFooterNode(selectedNode)
        ? selectedNode
        : null;

      if (footerNode !== null) {
        footerNode.setFields({
          ...footerNode.getFields(),
          ...payload,
        });
        return;
      }
    }

    let prevParent: ElementNode | FooterNode | null = null;
    let footerNode: FooterNode | null = null;

    nodes.forEach((node) => {
      const parent = node.getParent();
      if (
        parent === footerNode ||
        parent === null ||
        ($isElementNode(node) && !node.isInline())
      ) {
        return;
      }
      if ($isFooterNode(parent)) {
        footerNode = parent;
        parent.setFields({
          ...parent.getFields(),
          ...payload,
        });

        return;
      }

      if (!parent.is(prevParent)) {
        prevParent = parent;
        footerNode = $createFooterNode({ payload });

        if ($isTextNode(node)) {
          node.getParent().append(footerNode);
          if (node.getParent().getNextSibling() === null) {
            node.getParent().insertAfter($createParagraphNode());
          }
        } else {
          node.insertAfter(footerNode);
        }

        return;
      }

      if ($isFooterNode(node)) {
        if (node.is(footerNode)) {
          return;
        }

        if (footerNode !== null) {
          const children = node.getChildren();

          for (let i = 0; i < children.length; i += 1) {
            footerNode.append(children[i]);
          }
        }

        node.remove();
        return;
      }

      if (footerNode !== null) {
        footerNode.append(node);
      }
    });
  }
}

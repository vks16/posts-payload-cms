import { $isRangeSelection, $getSelection, SerializedElementNode} from "lexical";
import {
  convertLexicalNodesToHTML,
  FeatureProvider,
  HTMLConverter
} from "@payloadcms/richtext-lexical";
import { SectionWithEntries } from "@payloadcms/richtext-lexical/dist/field/features/format/common/floatingSelectToolbarSection";
import { MARK } from "./markdownTransformers";
import {
  $isMarkNode,
  MarkNode,
  $wrapSelectionInMarkNode,
  $unwrapMarkNode,
} from "@lexical/mark";

export const MarkTextFeature = (): FeatureProvider => {
  return {
    feature: () => {
      const markdownTransformers = [MARK];

      return {
        floatingSelectToolbar: {
          sections: [
            SectionWithEntries([
              {
                ChildComponent: () =>
                  // @ts-expect-error
                  import("./Mark").then((module) => module.default),

                isActive: ({ selection }) => {
                  if ($isRangeSelection(selection)) {
                    return !!selection
                      .getNodes()
                      .find(
                        (node) =>
                          $isMarkNode(node) || $isMarkNode(node.getParent())
                      );
                  }
                  return false;
                },

                key: "mark",
                onClick: ({ editor, isActive }) => {
                  editor.update(() => {
                    const selection = $getSelection();

                    if (isActive) {
                      selection.getNodes().forEach((node) => {
                        if ($isMarkNode(node)) {
                          $unwrapMarkNode(node);
                        } else if ($isMarkNode(node.getParent())) {
                          $unwrapMarkNode(node.getParent());
                        }
                      });
                    } else if ($isRangeSelection(selection)) {
                      $wrapSelectionInMarkNode(selection, false, "1");
                    }
                  });
                },
                order: 5,
              },
            ]),
          ],
        },
        markdownTransformers: markdownTransformers,
        props: null,
        nodes: [
          {
            converters: {
              html: {
                converter: async ({ converters, node, parent }) => {
                  const childrenText = await convertLexicalNodesToHTML({
                    converters,
                    lexicalNodes: node.children,
                    parent: {
                      ...node,
                      parent,
                    },
                  });

                  return `<mark>${childrenText}</mark>`;
                },
                nodeTypes: [MarkNode.getType()],
              } as HTMLConverter<SerializedElementNode>,
            },
            node: MarkNode,
            type: MarkNode.getType(),
          },
        ],
      };
    },
    key: "mark",
  };
};

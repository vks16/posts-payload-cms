import type { SanitizedConfig } from "payload/config";
import type { Field } from "payload/types";
import {
  convertLexicalNodesToHTML,
  FeatureProvider,
  HTMLConverter,
} from "@payloadcms/richtext-lexical";
import { SectionWithEntries } from "@payloadcms/richtext-lexical/dist/field/features/format/common/floatingSelectToolbarSection";
import { TOGGLE_FOOTER_WITH_MODAL_COMMAND } from "./plugins/FloatingFooterEditor/FooterEditor/commands";
import {
  FooterNode,
  SerializedFooterNode,
  TOGGLE_FOOTER_COMMAND,
} from "./nodes/FooterNode";



export const FooterFeature = (): FeatureProvider => {
  return {
    feature: () => {
      return {
        floatingSelectToolbar: {
          sections: [
            SectionWithEntries([
              {
                ChildComponent: () =>
                  // @ts-expect-error
                  import("./FooterIcon").then((module) => module.default),
                isActive: () => false,
                key: "footernote",
                onClick: ({ editor, isActive }) => {
                  if (!isActive) {
                    editor.dispatchCommand(
                      TOGGLE_FOOTER_WITH_MODAL_COMMAND,
                      null
                    );
                  } else {
                    // remove footer
                    editor.dispatchCommand(TOGGLE_FOOTER_COMMAND, null);
                  }
                },
                order: 6,
              },
            ]),
          ],
        },
        hooks: {},
        plugins: [
          {
            Component: () =>
              // @ts-expect-error
              import("./plugins/Footer").then((module) => module.FooterPlugin),
            position: "normal",
          },
          {
            Component: () =>
              // @ts-expect-error
              import("./plugins/FloatingFooterEditor").then((module) => {
                const footerEditorPlugin = module.FloatingFooterEditorPlugin;
                return footerEditorPlugin;
                // return import("payload/utilities").then((module) =>
                //   module.withMergedProps({
                //     Component: footerEditorPlugin,
                //     toMergeIntoProps: props,
                //   })
                // );
              }),
            position: "floatingAnchorElem",
          },
        ],

        props: null,
        nodes: [
          {
            converters: {
              html: {
                converter: async ({ converters, node, parent }) => {
                  const childrenText = await convertLexicalNodesToHTML({
                    converters,
                    lexicalNodes: node.fields.content,
                    parent: {
                      ...node,
                      parent,
                    },
                  });

                  const href: string = `#footer-content-${node.fields.id}`;

                  return `<sup><a href="${href}">${node.fields.label}</a></sup> <footer><ul><li id="footer-content-${node.fields.id}">
                     <div dangerouslySetInnerHTML={{ __html: ${childrenText} }} />
                  </li></ul></footer>`;
                },
                nodeTypes: [FooterNode.getType()],
              } as HTMLConverter<SerializedFooterNode>,
            },
            node: FooterNode,
            type: FooterNode.getType(),
          },
        ],
      };
    },
    key: "footernote",
  };
};

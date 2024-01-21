import path from "path";

import { payloadCloud } from "@payloadcms/plugin-cloud";
import { mongooseAdapter } from "@payloadcms/db-mongodb";
import { webpackBundler } from "@payloadcms/bundler-webpack";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload/config";

import Users from "./collections/Users";
import Posts from "./collections/Posts";
import { MarkTextFeature } from "./features/Mark";

const notAllowedFeatures = ["superscript", "subscript"]
export default buildConfig({
  admin: {
    user: Users.slug,
    bundler: webpackBundler(),
  },
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => {
      const filteredFeatures = defaultFeatures.filter(feat => !notAllowedFeatures.includes(feat.key))
      return [...filteredFeatures, MarkTextFeature()]
    },
  }),
  collections: [Users, Posts],
  typescript: {
    outputFile: path.resolve(__dirname, "payload-types.ts"),
  },
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, "generated-schema.graphql"),
  },
  plugins: [payloadCloud()],
  db: mongooseAdapter({
    url: process.env.DATABASE_URI,
  }),
});

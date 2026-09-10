export type JsonLdObject = {
  [key: string]: unknown;
};

export function buildJsonLdGraph(
  nodes: Array<JsonLdObject | null | undefined | false>,
): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@graph': nodes.filter((node): node is JsonLdObject => Boolean(node)),
  };
}

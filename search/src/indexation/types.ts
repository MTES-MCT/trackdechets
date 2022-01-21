/**
 * Indexing process configuration
 */
export interface IndexProcessConfig {
  alias: string;
  csvFileName: string;
  idKey: string;
  zipFileName: string;
  dataFormatterFn?: (
    body: ElasticBulkNonFlatPayload,
    extras: any
  ) => Promise<ElasticBulkNonFlatPayload>;
  mappings?: Record<string, any>;
  settings?: Record<string, any>;
}

/**
 * Bulk Indexing error
 */
export interface ElasticBulkIndexError {
  status: number;
  error: any;
  bulkBody?: Array<Record<string, any>>;
}

export type ElasticBulkPrepayload = {
  index: {
    _id: string;
    _index: string;
    // Next major ES version won't need _type anymore
    _type: "_doc";
  };
};

export type ElasticBulkPayloadDocument = Record<string, any>;

/**
 * Preprocessing Bulk payload
 */
export type ElasticBulkNonFlatPayload = Array<
  [ElasticBulkPrepayload, ElasticBulkPayloadDocument]
>;

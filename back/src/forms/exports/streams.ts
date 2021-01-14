import { Readable, Transform, ReadableOptions } from "stream";
import { Form, Prisma } from "@prisma/client";
import prisma from "src/prisma";
import { flattenForm } from "./transformers";
import { formatRow } from "./columns";

interface FormReaderOptions extends ReadableOptions {
  read?(this: FormReader, size: number): void;
}

class FormReader extends Readable {
  skip: number;
  constructor(opts?: FormReaderOptions) {
    super(opts);
    this.skip = 0;
  }
}

interface FormReaderArgs {
  whereInput?: Prisma.FormWhereInput;
  fieldsSelection?: Record<string, unknown>;
  chunk?: number;
}

/**
 * Reads forms in chunk
 */
export function formsReader({
  whereInput,
  fieldsSelection,
  chunk = 100
}: FormReaderArgs): Readable {
  const stream = new FormReader({
    objectMode: true,
    read(this) {
      const args = {
        take: chunk,
        skip: this.skip,
        ...(whereInput ? { where: whereInput } : {}),
        ...(fieldsSelection ? { select: fieldsSelection } : {})
      };

      prisma.form.findMany(args).then(forms => {
        if (!forms || forms.length === 0) {
          // end of stream
          this.push(null);
        } else {
          forms.forEach(form => {
            this.push(form);
          });
          this.skip = this.skip + forms.length;
        }
      });
    }
  });

  return stream;
}

/**
 * Format rows as data flow
 */
export function formsTransformer(opts = { useLabelAsKey: false }) {
  return new Transform({
    readableObjectMode: true,
    writableObjectMode: true,
    transform(form: Form, _encoding, callback) {
      const flattened = flattenForm(form);
      const formatted = formatRow(flattened, opts.useLabelAsKey);
      this.push(formatted);
      callback();
    }
  });
}

import { Readable, Transform, ReadableOptions } from "stream";
import { prisma, Form, FormWhereInput } from "../../generated/prisma-client";
import { formatForm, flattenForm } from "./transformers";

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
  whereInput?: FormWhereInput;
  fragment?: string;
  chunk?: number;
}

/**
 * Reads forms in chunk
 */
export function formsReader({
  whereInput,
  fragment,
  chunk = 100
}: FormReaderArgs): Readable {
  const stream = new FormReader({
    objectMode: true,
    read(this) {
      const args = {
        first: chunk,
        skip: this.skip,
        ...(whereInput ? { where: whereInput } : {})
      };

      const fragmentable = prisma.forms(args);

      const formsPromise = fragment
        ? fragmentable.$fragment<Form[]>(fragment)
        : fragmentable;
      formsPromise.then(forms => {
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
export function formsTransformer() {
  return new Transform({
    readableObjectMode: true,
    writableObjectMode: true,
    transform(form: Form, _encoding, callback) {
      const flattened = flattenForm(form);
      const formatted = formatForm(flattened);
      this.push(formatForm(formatted));
      callback();
    }
  });
}

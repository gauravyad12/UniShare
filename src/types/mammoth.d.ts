declare module 'mammoth' {
  interface ConvertToHtmlOptions {
    arrayBuffer?: ArrayBuffer;
    path?: string;
  }

  interface ConvertToHtmlResult {
    value: string;
    messages: any[];
  }

  export function convertToHtml(options: ConvertToHtmlOptions): Promise<ConvertToHtmlResult>;
} 
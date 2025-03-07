declare module 'exifr' {
  interface ExifrOptions {
    gps?: boolean;
    // Add other options as needed
  }

  interface ExifData {
    latitude?: number;
    longitude?: number;
    // Add other properties as needed
  }

  function parse(buffer: Buffer | ArrayBuffer, options?: ExifrOptions): Promise<ExifData>;

  export { parse };
  export default { parse };
} 
// for large strings, use this from https://stackoverflow.com/a/49124600
export const buff_to_base64 = (buff:any) => btoa(
  new Uint8Array(buff).reduce(
    (data, byte) => data + String.fromCharCode(byte), ''
  )
);

export const base64_to_buf = (b64:string) =>
  Uint8Array.from(atob(b64), (c) => c.charCodeAt(null));


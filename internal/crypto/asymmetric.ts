import { buff_to_base64, base64_to_buf} from './helper'

const enc = new TextEncoder();
const dec = new TextDecoder();

export async function generateKey() {
    const res = await crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 4096,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"],
    );
    const publicKey = await crypto.subtle.exportKey("jwk", res.publicKey);
    const privateKey = await crypto.subtle.exportKey("jwk", res.privateKey);
    return { publicKey, privateKey }
}

/* encrypt using public key in JWK format */
export async function encrypt(message:string, jwkPublicKey:any) {
    const publicKey = await crypto.subtle.importKey(
      "jwk",
      jwkPublicKey,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["encrypt"],
    );
    const cipherText = await crypto.subtle.encrypt(
      {
        name: "RSA-OAEP",
      },
      publicKey,
      enc.encode(message)
    );

    return buff_to_base64(new Uint8Array((cipherText)))
}

/* decrypt using private key in JWK format */
export async function decrypt(cipherText:string, jwkPrivateKey:any) {
    const cipherTextBuff = base64_to_buf(cipherText)
    const privateKey = await crypto.subtle.importKey(
      "jwk",
      jwkPrivateKey,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["decrypt"],
    );

    const result = await crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privateKey,
      cipherTextBuff,
    );

    return dec.decode(result)
}

export default {
  generateKey,
  encrypt,
  decrypt,
}

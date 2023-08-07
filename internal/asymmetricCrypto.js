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
export async function encrypt(message, jwkPublicKey) {
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

    return dec.decode(cipherText)
}

/* decrypt using private key in JWK format */
export async function decrypt(cipherText, jwkPrivateKey) {
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
      enc.encode(cipherText),
    );

    return dec.decode(result)
}

export default {
  generateKey,
  encrypt,
  decrypt,
}

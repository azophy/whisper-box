
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

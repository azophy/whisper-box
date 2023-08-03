'use client'
import { useState } from 'react'

const sleep = async (milliseconds) => {
  await new Promise(resolve => {
    return setTimeout(resolve, milliseconds)
  });
};

export default function Home() {
  const [key, setKey] = useState('')

  const isCryptoAvailable = (typeof window.crypto.subtle !== 'undefined')

  function encodeMessage(msg) {
    let enc = new TextEncoder();
    return enc.encode(msg);
  }

  async function generate() {
    setKey('generating...')
    let res = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 4096,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"],
    );

    setKey('converting...')
    const publicKey = await window.crypto.subtle.exportKey("jwk", res.publicKey);
    const privateKey = await window.crypto.subtle.exportKey("jwk", res.privateKey);
    setKey('done converting')

    setKey(JSON.stringify({ publicKey, privateKey }))
    await sleep(1000)

    setKey('encrypting...')

    const cipherText = await window.crypto.subtle.encrypt(
        {
          name: "RSA-OAEP",
        },
        res.publicKey,
        encodeMessage('abcdefg'),
      );

    let decoder = new TextDecoder()
    setKey('encryption result: ' + decoder.decode(cipherText))

    await sleep(3000)

    setKey('decrypting...')
    
    const decryptRes = await window.crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      res.privateKey,
      cipherText,
    );
    setKey('decryption result: ' + decoder.decode(decryptRes))
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <h1>WhisperBox</h1>

        <p>Share secrets safely, easily</p>

        <p>crypto is { isCryptoAvailable ? 'AVAILABLE' : 'NOT AVAILABLE' }</p>

        <p>
          key: { key }
        </p>

        <button
          type="button"
          onClick={generate}
          className="bg-blue-300 p-4 border rounded hover:bg-blue-500"
        >generate key</button>
      </div>
    </main>
  )
}

'use client'
import { useState } from 'react'
//const { split: shamirSplit, join: shamirJoin } = require('shamir');

const sleep = async (milliseconds) => {
  await new Promise(resolve => {
    return setTimeout(resolve, milliseconds)
  });
};

export default function Home() {
  const [status, setStatus] = useState('')
  const [encryptionMessage, setEncryptionMessage] = useState('')
  const [origMsg, setOrigMsg] = useState("sample message")
  const [key, setKey] = useState({})

  const isCryptoAvailable = (typeof window.crypto.subtle !== 'undefined')

  function encodeMessage(msg) {
    let enc = new TextEncoder();
    return enc.encode(msg);
  }

  const generate = async () => {
    setStatus('generating...')
    const res = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 4096,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"],
    );
    setStatus('converting...')
    const publicKey = await window.crypto.subtle.exportKey("jwk", res.publicKey);
    const privateKey = await window.crypto.subtle.exportKey("jwk", res.privateKey);
    setKey({ publicKey, privateKey })

    setStatus('done converting')
  }

  const simulateEncryption = async () => {
    const publicKey = await window.crypto.subtle.importKey(
      "jwk",
      key.publicKey,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["encrypt"],
    );

    const privateKey = await window.crypto.subtle.importKey(
      "jwk",
      key.privateKey,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["decrypt"],
    );

    setStatus('encrypting...')
    let msg = `original Message: ${origMsg}`

    const cipherText = await window.crypto.subtle.encrypt(
        {
          name: "RSA-OAEP",
        },
        publicKey,
        encodeMessage(origMsg)
      );

    const decodedChiperText = window.btoa(cipherText)
    let decoder = new TextDecoder()
    msg += "\nencryption result: " + decoder.decode(cipherText)

    setStatus('decrypting...')
    
    const decryptRes = await window.crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privateKey,
      cipherText,
    );
    msg += "\ndecryption result: " + decoder.decode(decryptRes)

    setEncryptionMessage(msg)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="p-10 bg-blue-200 w-full max-w-5xl items-center justify-between font-mono text-sm ">
        <h1 class="text-xl">WhisperBox</h1>

        <p class="font-italic">Share secrets safely, easily</p>
      </div>

      <article className="p-10 mt-5 bg-blue-200">
        <p>crypto is { isCryptoAvailable ? 'AVAILABLE' : 'NOT AVAILABLE' }</p>

        <p>
          status: { status }
        </p>

        <pre class="bg-gray-200 p-4 overflow-x-scroll max-w-2xl">
          key: { JSON.stringify(key, true, " ") }
        </pre>

        <button
          type="button"
          onClick={generate}
          className="bg-blue-300 p-4 border rounded hover:bg-blue-500"
        >Generate Keys</button>
      </article>

      <article className="p-10 mt-5 bg-blue-200">
        <div>
          <label>
            Message: 
          </label>
          <input
            type="text"
            value={origMsg}
            onInput={e => setOrigMsg(e.currentTarget.value)} 
          />
        </div>

        <pre class="bg-gray-200 p-4 overflow-x-scroll max-w-2xl">
          Encryption Message:
          { encryptionMessage }
        </pre>

        <button
          type="button"
          onClick={simulateEncryption}
          className="bg-blue-300 p-4 border rounded hover:bg-blue-500"
        >
          Simulate encryption
        </button>
      </article>
    </main>
  )
}

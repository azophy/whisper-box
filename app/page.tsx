'use client'
import { useState } from 'react'
const { split: shamirSplit, join: shamirJoin } = require('shamir');

const encoder = new TextEncoder();
const decoder = new TextDecoder()

const sleep = async (milliseconds: number) => {
  await new Promise(resolve => {
    return setTimeout(resolve, milliseconds)
  });
};

// adapted from: https://gist.github.com/alexdiliberto/39a4ad0453310d0a69ce
const getRandomBytes = function(n) {
  const QUOTA = 65536
  var a = new Uint8Array(n);
  for (var i = 0; i < n; i += QUOTA) {
    crypto.getRandomValues(a.subarray(i, i + Math.min(n - i, QUOTA)));
  }
  return a;
};

export default function Home() {
  const [status, setStatus] = useState('')
  const [encryptionMessage, setEncryptionMessage] = useState('')
  const [origMsg, setOrigMsg] = useState("sample message")
  const [key, setKey] = useState<any>({})
  const [shards, setShards] = useState<any>([])

  const isCryptoAvailable = (typeof crypto.subtle !== 'undefined')

  const generate = async () => {
    setShards([])
    setStatus('generating...')
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
    setStatus('converting...')
    const publicKey = await crypto.subtle.exportKey("jwk", res.publicKey);
    const privateKey = await crypto.subtle.exportKey("jwk", res.privateKey);
    setKey({ publicKey, privateKey })

    setStatus('splitting shards')
    console.log({ privateKey })

    //const secretBytes = encoder.encode(JSON.stringify(privateKey));
    const secretBytes = encoder.encode('22222');

    const parts = shamirSplit(getRandomBytes, 3, 2, secretBytes);
    console.log({ parts })
    const partsAsArrays = Object.keys(parts).map(i => Array.from(parts[i])).map(JSON.stringify)
    setShards(partsAsArrays)
    setStatus('splitting done')

    console.log(partsAsArrays.map(JSON.parse))
    let combinedParts = {}
    partsAsArrays.slice(1,3).map(JSON.parse).map(i => Uint8Array.from(i)).forEach((v,k) => combinedParts[k+1] = v)
    console.log({ combinedParts })
    const restoredSecret = decoder.decode(shamirJoin(combinedParts))
    console.log({ restoredSecret })
  }

  const simulateEncryption = async () => {
    const publicKey = await crypto.subtle.importKey(
      "jwk",
      key.publicKey,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["encrypt"],
    );

    const privateKey = await crypto.subtle.importKey(
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

    const cipherText = await crypto.subtle.encrypt(
        {
          name: "RSA-OAEP",
        },
        publicKey,
        encoder.encode(origMsg)
      );

    //const decodedChiperText = btoa(cipherText)
    msg += "\nencryption result: " + decoder.decode(cipherText)

    setStatus('decrypting...')
    
    const decryptRes = await crypto.subtle.decrypt(
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
        <h1 className="text-xl">WhisperBox</h1>

        <p className="font-italic">Share secrets safely, easily</p>
      </div>

      <article className="p-10 mt-5 bg-blue-200">
        <p>crypto is { isCryptoAvailable ? 'AVAILABLE' : 'NOT AVAILABLE' }</p>

        <p>
          status: { status }
        </p>

        <pre className="bg-gray-200 p-4 overflow-x-scroll max-w-2xl">
          key: { JSON.stringify(key, null, 2) }
        </pre>

        <button
          type="button"
          onClick={generate}
          className="bg-blue-300 p-4 border rounded hover:bg-blue-500"
        >Generate Keys</button>
      </article>

      <p>shards:</p>
      { shards.map(i => (
        <pre className="p-10 mt-5 bg-gray-200 overflow-x-scroll max-w-2xl">
          { i }
        </pre>
      )) }

      <p>combined_shards:</p>
      {/*
        (shards.length <1) 
          ? 'empty shards' 
          : decoder.decode(shamirJoin(
            Object.assign({}, shards.map(JSON.parse))
          ))
      */}

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

        <pre className="bg-gray-200 p-4 overflow-x-scroll max-w-2xl">
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

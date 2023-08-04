'use client'
import { useState } from 'react'

import { generateKey } from '../internal/asymmetricCrypto'
import { encryptData, decryptData } from '../internal/symmetricCrypto'
import shamir from '../internal/shamirCrypto'

const encoder = new TextEncoder();
const decoder = new TextDecoder()

const sleep = async (milliseconds: number) => {
  await new Promise(resolve => {
    return setTimeout(resolve, milliseconds)
  });
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
    const { publicKey, privateKey } = await generateKey()
    setStatus('done...')
    setKey({ publicKey, privateKey })

    setStatus('splitting shards')
    console.log({ privateKey })

    const parts = shamir.split(privateKey, 3, 2);
    const encodedParts = shamir.encodeParts(parts)
    console.log({ encodedParts })
    const encryptedParts = await Promise.all(encodedParts.map(async(item) => {
      const enc = await encryptData(JSON.stringify(item.data), 'password')
      return {
        index: item.index,
        encryptedData: enc,
      }
    }))
    console.log({ encryptedParts })
    setShards(JSON.stringify(encodedParts, null, 2))
    setStatus('splitting done')

    //const immediateParts = {
      //3: parts[3],
      //1: parts[1],
    //}
    //console.log({ immediateParts })
    //const immediateResult = (decoder.decode(shamirJoin(immediateParts)))
    //console.log({ immediateResult })

    const decryptedParts = await Promise.all(encryptedParts.map(async(item) => {
      const enc = await decryptData(item.encryptedData, 'password')
      return {
        index: item.index,
        data: JSON.parse(enc),
      }
    }))
    console.log({ decryptedParts })
    const restoredParts = shamir.decodeParts(decryptedParts)
    console.log({ restoredParts })

    const combinedParts = {
      1: restoredParts[1],
      2: restoredParts[2],
    }
    console.log({ combinedParts })
    const restoredSecret = shamir.join(combinedParts)
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

      <pre className="bg-gray-200 p-4 overflow-x-scroll max-w-2xl">
      Shards:
      { shards }
      </pre>

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

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

  const [passwords, setPasswords] = useState('')
  const [decryptPasswords, setDecryptPasswords] = useState('')
  const [numParts, setNumParts] = useState(3)
  const [quorum, setQuorum] = useState(2)

  const isCryptoAvailable = (typeof crypto.subtle !== 'undefined')

  const generate = async () => {
    setShards([])
    setStatus('generating...')
    const { publicKey, privateKey } = await generateKey()
    setStatus('done...')
    setKey({ publicKey, privateKey })

    setStatus('splitting shards')
    console.log({ privateKey, numParts, quorum })

    const parts = shamir.split(privateKey, Number(numParts), Number(quorum));
    const encodedParts = shamir.encodeParts(parts)
    console.log({ encodedParts })
    const splittedPasswords = passwords.split(',')
    const encryptedParts = await Promise.all(encodedParts.map(async(item) => {
      const enc = await encryptData(JSON.stringify(item.data), splittedPasswords[item.index-1])
      return {
        index: item.index,
        encryptedData: enc,
      }
    }))
    console.log({ encryptedParts })
    setShards(JSON.stringify(encodedParts, null, 2))
    setStatus('splitting done')

    let splittedDecryptPasswords = decryptPasswords.split(',')
    if (splittedDecryptPasswords.length < quorum) {
      console.log('number of decrypt password is less than required')
      return
    }

    let decryptedParts = []

    for (let ii = 0; ii < encodedParts.length; ii++) {
      const encPart = encryptedParts[ii]

      for (let ij = 0; ij < splittedDecryptPasswords.length; ij++) {
        const pass = splittedDecryptPasswords[ij]

        try {
          const res = await decryptData(encPart.encryptedData, pass)
          if (res) {
            decryptedParts.push({
              index: encPart.index,
              data: JSON.parse(res),
            })
            //delete splittedDecryptPasswords[ij]
            continue
          }
        } catch (e) {
          console.log({ ii, ij, e })
        }
      }
    }

    //await Promise.all(encryptedParts.map(async(item) => {
      //return {
        //index: item.index,
        //data: JSON.parse(enc),
      //}
    //}))
    console.log({ decryptedParts })
    const restoredParts = shamir.decodeParts(decryptedParts)
    console.log({ restoredParts })
    const restoredSecret = shamir.join(restoredParts)

    //const combinedParts = {
      //1: restoredParts[1],
      //2: restoredParts[2],
    //}
    //console.log({ combinedParts })
    //const restoredSecret = shamir.join(combinedParts)
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

        <div>
          <label htmlFor="">Number of parts</label>
          <input type="number" value={numParts}
            onInput={e => setNumParts(Number(e.currentTarget.value))}
          />
        </div>

        <div>
          <label htmlFor="">Number of quorum</label>
          <input type="number" value={quorum}
            onInput={e => setQuorum(Number(e.currentTarget.value))}
          />
        </div>

        <div>
          <label htmlFor="">List of passwords for encryption</label>
          <textarea 
            value={passwords}
            onInput={e => setPasswords(e.currentTarget.value)} 
          />
        </div>

        <div>
          <label htmlFor="">List of passwords for decryption</label>
          <textarea 
            value={decryptPasswords}
            onInput={e => setDecryptPasswords(e.currentTarget.value)} 
          />
        </div>

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

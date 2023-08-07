'use client'
import { useState } from 'react'
import Link from 'next/link';

import { generateKey } from '../internal/crypto/asymmetric'
import { encryptData, decryptData } from '../internal/crypto/symmetric'
import shamir from '../internal/crypto/shamir'

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

  const [title, setTitle] = useState('')
  const [passwords, setPasswords] = useState([])
  const [inputPassword, setInputPassword] = useState('')
  const [numParts, setNumParts] = useState(3)
  const [quorum, setQuorum] = useState(2)
  const [payloadDisplay, setPayloadDisplay] = useState('')
  const [newBoxId, setNewBoxId] = useState('')

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
    setStatus('splitting done')
    const encodedParts = shamir.encodeParts(parts)
    console.log({ encodedParts })
    setStatus('encrypting shards')
    const encryptedParts = await shamir.encryptParts(encodedParts, passwords)
    console.log({ encryptedParts })
    setShards(JSON.stringify(encodedParts, null, 2))
    setStatus('done')

    const payload = JSON.stringify({
      meta: {
        title,
        numParts,
        quorum,
      },
      publicKey,
      privateKey: encryptedParts,
    })
    setPayloadDisplay(payload)

    setStatus('submitting..')
    const resp = await fetch('/api/box', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    }).then(r => r.json()).catch(e => e.message)
    setPayloadDisplay(`created with id: ${resp.id}`)
    console.log({ id: resp.id, url: location.host + '/box/' + resp.id })
    setNewBoxId(resp.id)
    setStatus('submited')

/*
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
    */
  }

  const addPassword = function() {
    const newPasswords = passwords.slice()
    newPasswords.push(inputPassword)
    setPasswords(newPasswords)
    setInputPassword('')
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
        <Link href="/" className="text-xl">WhisperBox</Link>

        <p className="font-italic">Share secrets safely, easily</p>
      </div>

      <article className="p-10 mt-5 bg-blue-200">
        <p>crypto is { isCryptoAvailable ? 'AVAILABLE' : 'NOT AVAILABLE' }</p>

        <p>
          status: { status }
        </p>

        <div>
          <label htmlFor="">Box title</label>
          <input type="text" value={title}
            onInput={e => setTitle(e.currentTarget.value)}
            className="text-black"
          />
        </div>

        <div>
          <label htmlFor="">Number of required keys to unlock</label>
          <input type="number" value={quorum}
            onInput={e => setQuorum(Number(e.currentTarget.value))}
            className="text-black"
          />
        </div>

        <div>
          <label htmlFor="">Add available passwords here</label>
          <input type="password" value={inputPassword}
            onInput={e => setInputPassword(e.currentTarget.value)}
            className="text-black"
          />
          <button
            type="button"
            onClick={addPassword}
            className="bg-blue-300 p-2 border rounded hover:bg-blue-500"
          >add</button>
          <p>There are <strong className="font-bold">{passwords.length} passwords</strong> inserted</p>
        </div>

        <button
          type="button"
          onClick={generate}
          className="bg-blue-300 p-4 border rounded hover:bg-blue-500"
        >Generate Keys</button>
      </article>

      <article className="p-10 mt-5 bg-blue-200">
        { newBoxId
          ? <div>
              New Box created at: 
              <Link href={'/box/' + newBoxId} className="underline hover:nounderline">
                { window.location.host + '/box/' + newBoxId }
              </Link>
            </div>
          : ''
        }
        <pre className="bg-gray-200 p-4 overflow-x-scroll max-w-2xl">
        Payload:
        { 
        payloadDisplay
        }
        </pre>
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

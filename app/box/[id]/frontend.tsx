'use client'
import { useState } from 'react'
import Link from 'next/link';

import asym from '../../../internal/crypto/asymmetric'
import shamir from '../../../internal/crypto/shamir'

function MessageRow({ message, privateKey}) {
    const [clearContent, setClearContent] = useState('')

    const show = async () => {
      const decMessage = await asym.decrypt(message.content, privateKey)
      setClearContent(decMessage)
    }

    const hide = async () => {
      setClearContent('')
    }

    return (
        <div className="p-2 mb-4 bg-blue-200">
          {message.createdAt.toLocaleString('id-ID')} - {
            !privateKey
            ? 'LOCKED'
            : clearContent
              ? <div>
                {clearContent}
                <button className="bg-blue-200 border rounded p-2" onClick={hide} type="button">hide</button>
              </div>
              : <button className="bg-blue-200 border rounded p-2" onClick={show} type="button">
                show
              </button>
           }
        </div>
    )
}

export default function FrontendPage({ box }) {

    const [submitStatus, setSubmitStatus] = useState('')
    const [newMessage, setNewMessage] = useState('')
    const [privateKey, setPrivateKey] = useState<any>(null)
    const [inputPassword, setInputPassword] = useState('')
    const [unlockPasswords, setUnlockPasswords] = useState([])

    const title = box?.meta?.title
    const numParts = box?.meta?.numParts
    const quorum = box?.meta?.quorum
    const publicKey = box?.publicKey
    const encryptedPrivateKey = box?.privateKey

    const submitMessage = async () => {
      setSubmitStatus('encrypting...')
      const encMessage = await asym.encrypt(newMessage, box.publicKey)

      setSubmitStatus('submitting...')
      const resp = await fetch('/api/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boxId: box.id,
          content: encMessage,
        }),
      }).then(r => r.json()).catch(e => e.message)

      setSubmitStatus('done...')
      setNewMessage('')

      location.reload()
    }

    const lockPrivateKey = () => {
      setPrivateKey(null)
    }

    const addUnlockPassword = () => {
        const newPass = unlockPasswords.slice()
        newPass.push(inputPassword)
        setInputPassword('')
        setUnlockPasswords(newPass)
    }

    const unlockPrivateKey = async () => {
      setSubmitStatus('unlocking box...')
      try {
        setSubmitStatus('decrypting keys...')
        const decryptedParts = await shamir.decryptParts(encryptedPrivateKey, unlockPasswords)
        setUnlockPasswords([])
        const restoredParts = shamir.decodeParts(decryptedParts)
        setSubmitStatus('rebuilding keys...')
        const restoredSecret = shamir.join(restoredParts)
        setPrivateKey(JSON.parse(restoredSecret))
        setSubmitStatus('done')
      } catch (e) {
        setSubmitStatus('error: ' + e.message + e.stack)
      }7
    }

    return (
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <nav className="p-10 mt-5 bg-blue-200 text-black">
          <Link
            href="/"
            className="text-lg font-bold"
          >WhisperBox</Link>

          { submitStatus
            ? <div className="mt-4 font-italic p-2 bg-gray-200">{submitStatus}</div>
            : ''
          }

        </nav>
        
        <article className="p-10 mt-5 bg-blue-200 text-black">
          <h1 className="font-bold text-xl">{ title }</h1>

          <p>require {quorum} keys of {numParts} to unlock</p>

          { privateKey ? 
              <div>
                <button
                  onClick={lockPrivateKey}
                  className="bg-blue-300 p-4 border rounded hover:bg-blue-500"
                >
                  lock box
                </button>
              </div>
          : 
              <div>
                <label htmlFor="">passwords to unlock</label>
                <input
                  type="password"
                  value={inputPassword}
                  onInput={e => setInputPassword(e.currentTarget.value)}
                />

                <p>there are <span className="font-bold">{unlockPasswords.length}</span> keys inserted</p>

                <button
                  onClick={addUnlockPassword}
                  className="bg-blue-300 p-4 border rounded hover:bg-blue-500"
                >
                  add passwords
                </button>
                <button
                  onClick={unlockPrivateKey}
                  className="bg-blue-300 p-4 border rounded hover:bg-blue-500"
                >
                  unlock box
                </button>
              </div>
          }
        </article>
        
        <article className="p-10 mt-5 bg-blue-200 text-black">
          <h2 className="font-bold text-lg">Submit new message</h2>

          <textarea 
            value={newMessage}
            onInput={e => setNewMessage(e.currentTarget.value)}
            row="5"
            col="30"
          />

          <button
            type="button"
            onClick={submitMessage}
            className="bg-blue-300 p-4 border rounded hover:bg-blue-500"
          >Submit</button>
        </article>
        
        <article className="p-2 mt-5 bg-gray-200 text-black">
          { box?.messages?.map(msg => (
            <MessageRow
              message={msg}
              privateKey={privateKey}
              key={msg.id}
            />
          )) }
        </article>
      </main>
     )
}


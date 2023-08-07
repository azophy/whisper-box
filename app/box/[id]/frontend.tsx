'use client'
import { useState } from 'react'
import Link from 'next/link';

import asym from '../../../internal/crypto/asymmetric'
import shamir from '../../../internal/crypto/shamir'

export default function FrontendPage({ box }) {

    const [submitStatus, setSubmitStatus] = useState('')
    const [newMessage, setNewMessage] = useState('')
    const [messages, setMessages] = useState(box?.messages.map(item => { ...item, clearContent: ''}))
    const [privatekey, setPrivateKey] = useState({})
    const [unlockPasswords, setUnlockPasswords] = useState('')

    const title = box?.meta?.title
    const numParts = box?.meta?.numParts
    const quorum = box?.meta?.quorum
    const publicKey = box?.meta?.publicKey
    const encryptedPrivateKey = box?.meta?.privateKey

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

      console.log({ resp })
    }

    const unlockPrivateKey = () => {
      const splittedPasswords = unlockPasswords.split(',')
      const decryptedParts = shamir.decryptParts(encryptedPrivateKey, splittedPasswords)
    }

    return (
      <main className="flex min-h-screen flex-col items-center justify-between p-24">
        <nav className="p-10 mt-5 bg-blue-200 text-black">
          <Link
            href="/"
            className="text-lg font-bold"
          >WhisperBox</Link>
        </nav>
        
        <article className="p-10 mt-5 bg-blue-200 text-black">
          <h1 className="font-bold text-xl">{ title }</h1>

          <p>require {quorum} keys of {numParts} to unlock</p>

          { privateKey ? '' : 
            <>
              <div>
                <label htmlFor="">passwords to unlock</label>
                <input
                  type="text"
                  value={unlockPasswords}
                  onInput={e => setUnlockPasswords(e.currentTarget.value)}
                />
              </div>
            </>
          }
        </article>
        
        <article className="p-10 mt-5 bg-blue-200 text-black">
          <h2 className="font-bold text-lg">Submit new message</h2>

          { submitStatus
            ? <div className="font-italic p-2 bg-gray-200">{submitStatus}</div>
            : ''
          }

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
        
        <article className="p-10 mt-5 bg-blue-200 text-black">
          { messages.map(msg => (
            <div className="p-4 mb-2 bg-blue-200">
              {msg.created_at} - {msg.clearContent ? msg.clearContent : LOCKED}
            </div>
          )) }
        </article>
      </main>
     )
}


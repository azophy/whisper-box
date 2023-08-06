import Link from 'next/link';

import prisma from '../../../internal/prisma'

export default async function Page(
  { params }: { params: { id: string } }
) {
    const box = await prisma.box.findUnique({
      where: { id: params.id },
      include: {
        messages: true,
      },
    });

    const title = box?.meta?.title
    const numParts = box?.meta?.numParts
    const quorum = box?.meta?.quorum
    const publicKey = box?.meta?.publicKey
    const encryptedPrivateKey = box?.meta?.privateKey

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

          { box?.messages?.map(msg => (
            <div className="p-4 mb-2 bg-blue-200">
              {msg.created_at} - {msg.content}
            </div>
          )) }
        </article>
      </main>
     )
}

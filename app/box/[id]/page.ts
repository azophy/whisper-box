import { prisma } from '../../../internal/prisma'

export default function Page(
  { params }: { params: { id: string } }
) {
    const box = await prisma.box.findMany({
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

    return
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <article className="p-10 mt-5 bg-blue-200">
        <h1 class="font-bold text-xl">{ box.metat.title }</h1>

        <p>require {quorum} keys of {numParts} to unlock</p>

        { box.messages.map(msg => (
          <div class="p-4 mb-2 bg-blue-200 text-black">
            {msg.created_at} - {msg.content}
          </div>
        )) }
      </article>
    </main>
}

import prisma from '../../../internal/prisma'
import FrontendPage from './frontend'

export default async function BackendPage(
  { params }: { params: { id: string } }
) {
    const box = await prisma.box.findUnique({
      where: { id: params.id },
      include: {
        messages: true,
      },
    });

    return (<FrontendPage box={box} />)
}

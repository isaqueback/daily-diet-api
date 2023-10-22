import { FastifyReply, FastifyRequest } from 'fastify'
import { knex } from '../database'

export async function checkUserExists(
  request: FastifyRequest<{ Params: { userId: string } }>,
  reply: FastifyReply,
) {
  const { userId } = request.params
  const { sessionId } = request.cookies

  const user = await knex('users')
    .select()
    .where({
      id: userId,
      session_id: sessionId,
    })
    .first()

  if (!user) return reply.status(404).send({ error: 'User not found.' })
}

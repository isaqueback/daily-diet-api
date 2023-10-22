import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import { randomUUID } from 'crypto'
import { checkSessionIdExists } from '../middlewares/checkSessionIdExists'

export async function usersRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    const users = await knex('users').select()

    return { users }
  })

  app.get<{ Params: { id: string } }>(
    '/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const getUsersParamsSchema = z.object({
        id: z.string().uuid(),
        sessionId: z.string().uuid(),
      })

      const { sessionId } = request.cookies
      const dataToValidate = {
        id: request.params.id,
        sessionId,
      }

      const { id } = request.params

      const validParams = getUsersParamsSchema.safeParse(dataToValidate)

      if (!validParams.success) {
        return reply.status(422).send({
          error: 'Error on validate schema.',
          details: validParams.error,
        })
      }

      const user = await knex('users')
        .select()
        .where({ id, session_id: sessionId })
        .first()

      return { user }
    },
  )

  app.post('/', async (request, reply) => {
    const createUsersBodySchema = z.object({
      name: z.string(),
    })

    const validBody = createUsersBodySchema.safeParse(request.body)

    if (!validBody.success) {
      return reply.status(422).send({
        error: 'Error on validate schema.',
        details: 'Invalid user name format.',
      })
    }

    let { sessionId } = request.cookies
    if (sessionId) {
      reply.clearCookie('sessionId', { path: '/' })
    }

    sessionId = randomUUID()

    reply.cookie('sessionId', sessionId, {
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    })

    const { name } = validBody.data

    await knex('users').insert({
      id: randomUUID(),
      session_id: sessionId,
      name,
    })

    reply.status(201).send()
  })

  app.delete<{ Params: { id: string } }>(
    '/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const getUsersHeadersParamsSchema = z.object({
        id: z.string().uuid(),
        sessionId: z.string().uuid(),
      })

      const { sessionId } = request.cookies
      const dataToValidate = {
        id: request.params.id,
        sessionId,
      }

      const validParams = getUsersHeadersParamsSchema.safeParse(dataToValidate)

      if (!validParams.success) {
        return reply.status(422).send({
          error: 'Error on validate schema.',
          details: validParams.error,
        })
      }

      const { id } = validParams.data

      const user = await knex('users').delete().where({
        id,
        session_id: sessionId,
      })

      if (!user) return reply.status(404).send({ error: 'User not found.' })

      return reply.status(204).send()
    },
  )
}

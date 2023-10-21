import { FastifyInstance } from 'fastify'
import { z } from 'zod'

export async function usersRoutes(app: FastifyInstance) {
  app.get('/', async (request, reply) => {
    return reply.send('Hello World!')
  })

  app.post('/', async (request, reply) => {
    return reply.send('Hello World!')
  })
}

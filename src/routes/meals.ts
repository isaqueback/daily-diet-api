import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'
import { checkSessionIdExists } from '../middlewares/checkSessionIdExists'
import { checkUserExists } from '../middlewares/checkUserExists'
import { randomUUID } from 'crypto'

export async function mealsRoutes(app: FastifyInstance) {
  app.get<{ Params: { userId: string } }>(
    '/',
    { preHandler: [checkSessionIdExists, checkUserExists] },
    async (request, reply) => {
      const { userId } = request.params

      const meals = await knex('meals').select().where('user_id', userId)

      return reply.send({ meals })
    },
  )

  app.get<{ Params: { userId: string; mealId: string } }>(
    '/:mealId',
    { preHandler: [checkSessionIdExists, checkUserExists] },
    async (request, reply) => {
      const getUsersHeadersParamsSchema = z.object({
        mealId: z.string().uuid(),
      })

      const { userId, mealId } = request.params

      const validData = getUsersHeadersParamsSchema.safeParse({ mealId })

      if (!validData.success) {
        return reply.status(422).send({
          error: 'Error on validate schema.',
          details: validData.error,
        })
      }

      const meal = await knex('meals')
        .select()
        .where({
          id: mealId,
          user_id: userId,
        })
        .first()

      return reply.send({ meal })
    },
  )

  app.post<{ Params: { userId: string } }>(
    '/',
    { preHandler: [checkSessionIdExists, checkUserExists] },
    async (request, reply) => {
      const { userId } = request.params

      const createMealsBodySchema = z.object({
        name: z.string(),
        description: z.string().optional(),
        inDiet: z.boolean(),
      })

      const validData = createMealsBodySchema.safeParse(request.body)

      if (!validData.success) {
        return reply
          .status(422)
          .send({ error: 'Error on validate schema', details: validData.error })
      }

      const { name, description, inDiet } = validData.data

      const mealToAdd = {
        id: randomUUID(),
        user_id: userId,
        name,
        description,
        in_diet: inDiet,
      }

      const meal = await knex('meals').insert(mealToAdd).returning('*')

      return reply.send({ meal })
    },
  )

  
}

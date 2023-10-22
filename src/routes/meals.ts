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

  app.get<{ Params: { userId: string } }>(
    '/summary',
    { preHandler: [checkSessionIdExists, checkUserExists] },
    async (request, reply) => {
      const { userId } = request.params
      const { sessionId } = request.cookies

      const getMealsParamsSchema = z.object({
        sessionId: z.string().uuid(),
      })

      const validData = getMealsParamsSchema.safeParse({ sessionId })

      if (!validData.success) {
        return reply.status(422).send({
          error: 'Error on validate schema.',
          details: validData.error,
        })
      }

      const meals = await knex('meals').where('user_id', userId)
      const amountInDiet = (
        await knex('meals').where({
          user_id: userId,
          in_diet: true,
        })
      ).length

      let bestSequenceInDiet: typeof meals = []
      let currentSequenceInDiet = []

      for (const meal of meals) {
        if (meal.in_diet) {
          currentSequenceInDiet.push(meal)
          if (currentSequenceInDiet.length > bestSequenceInDiet.length) {
            bestSequenceInDiet = [...currentSequenceInDiet]
          }
        } else {
          currentSequenceInDiet = []
        }
      }

      const summary = {
        amount: meals.length,
        amount_in_diet: amountInDiet,
        amount_not_in_diet: meals.length - amountInDiet,
        best_sequence_in_diet: bestSequenceInDiet,
      }

      return { summary }
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

  app.put<{
    Params: { userId: string; mealId: string }
    Body: {
      name: string
      description: string
      inDiet: boolean
      consumedAt: string
    }
  }>(
    '/:mealId',
    {
      preHandler: [checkSessionIdExists, checkUserExists],
    },
    async (request, reply) => {
      const { userId, mealId } = request.params
      const { sessionId } = request.cookies
      const { name, description, inDiet, consumedAt } = request.body

      const getMealsParamsBodySchema = z.object({
        mealId: z.string().uuid(),
        sessionId: z.string().uuid(),
        name: z.string().optional(),
        description: z.string().optional(),
        inDiet: z.boolean().optional(),
        consumedAt: z.date().optional(),
      })

      const dataToValidate = {
        mealId,
        sessionId,
        ...request.body,
      }

      const validData = getMealsParamsBodySchema.safeParse(dataToValidate)

      if (!validData.success) {
        return reply.status(422).send({
          error: 'Error on validate schema.',
          details: validData.error,
        })
      }

      const updatedMeal = {
        name,
        description,
        in_diet: inDiet,
        consumed_at: consumedAt,
        updated_at: new Date().toISOString(),
      }

      const meal = await knex('meals')
        .where({ id: mealId, user_id: userId })
        .update(updatedMeal)
        .returning('*')

      if (meal.length === 0) {
        return reply.status(404).send({ error: 'Meal not found.' })
      }

      return reply.send({ meal })
    },
  )

  app.delete<{ Params: { userId: string; mealId: string } }>(
    '/:mealId',
    {
      preHandler: [checkSessionIdExists, checkUserExists],
    },
    async (request, reply) => {
      const { userId, mealId } = request.params
      const { sessionId } = request.cookies

      const getMealsParamsSchema = z.object({
        mealId: z.string().uuid(),
        sessionId: z.string().uuid(),
      })

      const validData = getMealsParamsSchema.safeParse({ mealId, sessionId })

      if (!validData.success) {
        return reply.status(422).send({
          error: 'Error on validate schema.',
          details: validData.error,
        })
      }

      const meal = await knex('meals').delete().where({
        id: mealId,
        user_id: userId,
      })

      if (!meal) return reply.status(404).send({ error: 'Meal not found.' })

      return reply.send()
    },
  )
}

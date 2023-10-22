// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Knex } from 'knex'

interface Meal {
  id: string
  user_id: string
  name: string
  description: string
  in_diet: boolean
  consumed_at: string
  created_at: string
  updated_at: string
}

declare module 'knex/types/tables' {
  export interface Tables {
    users: {
      id: string
      session_id: string
      name: string
      created_at: string
      updated_at: string
    }
    meals: Meal
  }
}

import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('meals', (table) => {
    table.uuid('id').primary()
    table
      .uuid('user_id')
      .references('users.id')
      .notNullable()
      .onDelete('CASCADE')
    table.text('name').notNullable()
    table.text('description')
    table.boolean('in_diet').notNullable()
    table.timestamp('consumed_at').defaultTo(knex.fn.now())
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.fn.now())
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('meals')
}

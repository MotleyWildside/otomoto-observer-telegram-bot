import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
import {sql} from "drizzle-orm";
export const chatsIdsTable = sqliteTable("chats_ids_table", {
  id: int().primaryKey({ autoIncrement: true }),
  chatId: text().notNull(),
});

export const processedCarIdsTable = sqliteTable("processed_car_ids_table", {
  id: int().primaryKey({ autoIncrement: true }),
  chatId: text().notNull(),
  processedId: text("processedId", { mode: "json" })
    .notNull()
    .$type<string[]>()
});

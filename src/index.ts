import TelegramBot from 'node-telegram-bot-api';
import {OtomotoController} from "./controllers/OtomotoController";
import { drizzle } from 'drizzle-orm/libsql';


import 'dotenv/config';
import {chatsIdsTable, processedCarIdsTable} from "./db/schema";
import {eq} from "drizzle-orm";


const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const otomotoController = new OtomotoController();
const db = drizzle(process.env.DB_FILE_NAME!);

console.log('Bot is running');

// Перезапускаем polling при запуске
bot.on("polling_error", (error) => {
  console.error("Polling error:", error);
  bot.stopPolling();
  setTimeout(() => bot.startPolling(), 5000);
});

setInterval(() => checkWebsites(), 5 * 60 * 1000);

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  console.log('Started with chat ID: ', chatId);
  const [chat] = await db.select().from(chatsIdsTable).where(eq(chatsIdsTable.chatId, String(chatId)));
  if (chat) {
    bot.sendMessage(chatId, 'Мониторинг уже запущен для этого чата.');
  } else {
    bot.sendMessage(chatId, 'Бот запущен! Начинаю мониторинг объявлений...');
    await db.insert(chatsIdsTable).values({chatId: String(chatId)});
    checkWebsites(chatId.toString());
  }
});

bot.onText(/\/stop/, async (msg) => {
  await db.delete(chatsIdsTable).where(eq(chatsIdsTable.chatId, String(msg.chat.id)));
  await db.delete(processedCarIdsTable).where(eq(processedCarIdsTable.chatId, String(msg.chat.id)));
  console.log('Stopped with chat ID: ', msg.chat.id);
  bot.sendMessage(msg.chat.id, `Мониторинг для чата ${msg.chat.id} остановлен.`);
});


export const checkWebsites = async (chatId?: string) => {
  try {
    console.log('Checking website in progress...');
    const newItems = await otomotoController.checkForNewListings();
    const chatsList = chatId ? [{chatId}] : await db.select().from(chatsIdsTable);
    for (const chatItem of chatsList) {
      const localNewItems = {...newItems};
      const [processedIdsList] = await db.select().from(processedCarIdsTable).where(eq(processedCarIdsTable.chatId, String(chatItem.chatId)));
      const processedIdsBuffer = processedIdsList?.processedId || [];
      processedIdsBuffer.forEach(id => {
        if (localNewItems[id]) {
          delete localNewItems[id];
        }
      });

      if (Object.keys(localNewItems).length > 0) {
        bot.sendMessage(chatItem.chatId, `Найдено ${Object.keys(localNewItems).length} новых объявлений: \n${Object.values(localNewItems).join('\n\n')}`);
      }
      if (processedIdsList) {
        await db.update(processedCarIdsTable).set({processedId: [...processedIdsBuffer, ...Object.keys(localNewItems)]}).where(eq(processedCarIdsTable.chatId, String(chatItem.chatId)));
      } else {
        await db.insert(processedCarIdsTable).values({chatId: String(chatItem.chatId), processedId: Object.keys(localNewItems)});
      }
    }
  } catch (error) {
    console.error(`❌ Error checking websites: ${error.message}`);
  }
};


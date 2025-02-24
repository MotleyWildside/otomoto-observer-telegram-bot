import TelegramBot from 'node-telegram-bot-api';
import {OtomotoController} from "./controllers/OtomotoController";
import 'dotenv/config';


const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const chatsSet = new Set();
const processedIds = new Map<string, string[]>();
const otomotoController = new OtomotoController();

console.log('Bot is running');

setInterval(() => checkWebsites(), 5 * 60 * 1000);

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  console.log('Started with chat ID: ', chatId);
  if (chatsSet.has(chatId)) {
    bot.sendMessage(chatId, 'Мониторинг уже запущен для этого чата.');
  } else {
    bot.sendMessage(chatId, 'Бот запущен! Начинаю мониторинг объявлений...');
    chatsSet.add(chatId);
    checkWebsites(chatId.toString());
  }
});

bot.onText(/\/stop/, (msg) => {
  chatsSet.delete(msg.chat.id);
  console.log('Stopped with chat ID: ', msg.chat.id);
  bot.sendMessage(msg.chat.id, `Мониторинг для чата ${msg.chat.id} остановлен.`);
});


const checkWebsites = async (chatId?: string) => {
  try {
    console.log('Checking websites...');
    const newItems = await otomotoController.checkForNewListings();
    console.log('Checked in: ', new Date().toLocaleString());
    chatsSet.forEach((chatId: string) => {
      const localNewItems = {...newItems};
      if (processedIds.has(chatId)) {
        processedIds.get(chatId).forEach(id => {
          if (localNewItems[id]) {
            delete localNewItems[id];
          }
        });
      } else {
        processedIds.set(chatId, []);
      }
      if (Object.keys(localNewItems).length > 0) {
        bot.sendMessage(chatId, `Найдено ${Object.keys(localNewItems).length} новых объявлений: \n${Object.values(localNewItems).join('\n\n')}`);
      }
      processedIds.get(chatId).push(...Object.keys(localNewItems));
    });
  } catch (error) {
    console.error(`❌ Error checking websites: ${error.message}`);
  }
};


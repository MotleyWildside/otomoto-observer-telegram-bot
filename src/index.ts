import TelegramBot from 'node-telegram-bot-api';
import {OtomotoController} from "./controllers/OtomotoController";
import 'dotenv/config';


const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const chatsSet = new Set();
const otomotoController = new OtomotoController();

console.log('Bot is running');

setInterval(() => checkWebsites(), 5 * 60 * 1000);

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  console.log('Started with chat ID: ', chatId);
  bot.sendMessage(chatId, 'Бот запущен! Начинаю мониторинг объявлений...');
  chatsSet.add(chatId);
});

bot.onText(/\/stop/, (msg) => {
  chatsSet.delete(msg.chat.id);
  console.log('Stopped with chat ID: ', msg.chat.id);
  bot.sendMessage(msg.chat.id, `Мониторинг для чата ${msg.chat.id} остановлен.`);
});

const checkWebsites = async () => {
  try {
    const newItems = await otomotoController.checkForNewListings();
    console.log('Checked in: ', new Date().toLocaleString());
    const newItemsFlat = newItems.flat();
    if (newItemsFlat.length === 0) {
      return;
    } else {
      chatsSet.forEach(chatId => {
        bot.sendMessage(chatId, `Найдено ${newItemsFlat.length} новых объявлений: \n${newItemsFlat.join('\n\n')}`);
      });
    }
  } catch (error) {
    console.error(`❌ Error checking websites: ${error.message}`);
  }
};


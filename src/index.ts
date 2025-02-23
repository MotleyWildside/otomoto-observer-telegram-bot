import TelegramBot from 'node-telegram-bot-api';
import {OtomotoController} from "./controllers/OtomotoController";

const TOKEN = '7453481532:AAG0kTIs433v0iujEU8Kc0t7dfF7EeRkzUg'

const bot = new TelegramBot(TOKEN, { polling: true });
const intervalList = new Map();
const controllersMap = new Map();

// Обработка команды /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Бот запущен! Начинаю мониторинг объявлений...');
  if (!controllersMap.has(chatId)) {
    controllersMap.set(chatId, [new OtomotoController()]);
  }
  checkWebsites(chatId);
  intervalList.set(chatId, setInterval(() => checkWebsites(chatId), 30 * 60 * 1000));
});

bot.onText(/\/stop/, (msg) => {
  clearInterval(intervalList.get(msg.chat.id));
  bot.sendMessage(msg.chat.id, `Мониторинг для чата ${msg.chat.id} остановлен.`);
});

const checkWebsites = async (chatId: string) => {
  try {
    const controllersList = controllersMap.get(chatId);
    const newItems = await Promise.all(controllersList.map(controller => controller.checkForNewListings()));

    const newItemsFlat = newItems.flat();
    if (newItemsFlat.length === 0) {
      // bot.sendMessage(chatId, `Новых объявлений не найдено для чата ${chatId}`);
      return;
    } else {
      bot.sendMessage(chatId, `Найдено ${newItemsFlat.length} новых объявлений: \n${newItemsFlat.join('\n')}`);
    }
  } catch (error) {
    console.error(`❌ Error checking websites: ${error.message}`);
  }
};


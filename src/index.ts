import TelegramBot from 'node-telegram-bot-api';
import {OtomotoController} from "./controllers/OtomotoController";
import 'dotenv/config';


const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const intervalList = new Map();
const controllersMap = new Map();

console.log('Bot is running');

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  console.log('Started with chat ID: ', chatId);
  bot.sendMessage(chatId, 'Бот запущен! Начинаю мониторинг объявлений...');
  if (!controllersMap.has(chatId)) {
    controllersMap.set(chatId, [new OtomotoController()]);
  }
  checkWebsites(chatId);
  intervalList.set(chatId, setInterval(() => checkWebsites(chatId), 5 * 60 * 1000));
});

bot.onText(/\/stop/, (msg) => {
  clearInterval(intervalList.get(msg.chat.id));
  console.log('Stopped with chat ID: ', msg.chat.id);
  bot.sendMessage(msg.chat.id, `Мониторинг для чата ${msg.chat.id} остановлен.`);
});

const checkWebsites = async (chatId: string) => {
  console.log(`Checking websites for chat ${chatId} n ${new Date().toLocaleDateString()}`);
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


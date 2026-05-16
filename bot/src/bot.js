import { Telegraf, Markup } from "telegraf";
import { registerOrderActions } from "./orderHandlers.js";
import { env } from "./config/env.js";

export function createBot(token) {
  const bot = new Telegraf(token);
  const webAppUrl = env.WEB_APP_URL;

  console.log("[bot] WEB_APP_URL:", webAppUrl);

  bot.start(async (ctx) => {
    console.log("[bot] /start — user:", ctx.from?.id, "WEB_APP_URL:", webAppUrl);

    // Eski reply keyboard'ni tozalash
    await ctx.reply("...", { reply_markup: { remove_keyboard: true } });

    await ctx.reply(
      `Salom, ${ctx.from.first_name}! 🍕\n\nQoshiqcha fast food ga xush kelibsiz. Pastdagi tugma orqali buyurtma bering 👇`,
      Markup.inlineKeyboard([[Markup.button.webApp("🛒 Buyurtma berish", webAppUrl)]]),
    );
  });

  bot.command("menu", (ctx) =>
    ctx.reply(
      "Menyuni ochish:",
      Markup.inlineKeyboard([[Markup.button.webApp("🛒 Menyu", webAppUrl)]]),
    ),
  );

  registerOrderActions(bot);

  return bot;
}

const { Telegraf, Markup } = require("telegraf");
const { GoogleSpreadsheet } = require("google-spreadsheet");

// BOT TOKEN
const bot = new Telegraf(process.env.BOT_TOKEN);

// GOOGLE SHEET
const SHEET_ID = process.env.SHEET_ID;
let sheet;

// ================= CONNECT GOOGLE SHEET =================
async function initSheet() {
  try {
    const doc = new GoogleSpreadsheet(SHEET_ID);

    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    });

    await doc.loadInfo();
    sheet = doc.sheetsByIndex[0];

    await sheet.setHeaderRow([
      "User ID",
      "Name",
      "Username",
      "Market Interest",
      "Service Type",
      "Budget",
      "Premium Selection",
      "Account Handling Capital",
      "Date & Time",
    ]);

    console.log("Google Sheet Connected 🟢");
  } catch (err) {
    console.log("Sheet Error:", err);
  }
}

let users = {};
function save(id, key, value) {
  if (!users[id]) users[id] = {};
  users[id][key] = value;
}

// ================= START =================
bot.start(async (ctx) => {
  const id = ctx.from.id;
  users[id] = {};

  await ctx.reply(
`Welcome to Ce & Pe EduempireX 📈

Hum experienced trading team hain aur aapke liye best service recommend karna chahte hain.

Chaliye shuru karte hain 😊

✅ Question 1:
Aap kis market me interest rakhte ho?`,
    Markup.inlineKeyboard([
      [Markup.button.callback("📊 Stock Market", "market_stock")],
      [Markup.button.callback("💱 Forex Market", "market_forex")],
    ])
  );
});

// ================= MARKET =================
bot.action(["market_stock", "market_forex"], async (ctx) => {
  const id = ctx.from.id;

  save(
    id,
    "market",
    ctx.update.callback_query.data.includes("stock")
      ? "Stock Market"
      : "Forex Market"
  );

  await ctx.reply(
`✅ Question 2:
Aap kaunsa option choose karna chahoge?`,
    Markup.inlineKeyboard([
      [Markup.button.callback("📘 Premium Channel", "service_premium")],
      [Markup.button.callback("🤝 Account Handling", "service_account")],
    ])
  );
});

// ================= PREMIUM =================
bot.action("service_premium", async (ctx) => {
  save(ctx.from.id, "service", "Premium Channel");

  await ctx.reply(
`✅ Question 3:
Aap monthly approx kitna capital invest kar sakte ho?`,
    Markup.inlineKeyboard([
      [Markup.button.callback("💰 ₹20,000", "budget_20")],
      [Markup.button.callback("💰 ₹50,000", "budget_50")],
      [Markup.button.callback("💰 ₹1,00,000", "budget_1")],
      [Markup.button.callback("💰 ₹2,50,000", "budget_25")],
    ])
  );
});

// ================= ACCOUNT =================
bot.action("service_account", async (ctx) => {
  save(ctx.from.id, "service", "Account Handling");

  await ctx.reply(
`✅ Question 3:
Aap monthly approx kitna capital manage karwana chahoge?`,
    Markup.inlineKeyboard([
      [Markup.button.callback("💰 ₹20,000", "budget_20")],
      [Markup.button.callback("💰 ₹50,000", "budget_50")],
      [Markup.button.callback("💰 ₹1,00,000", "budget_1")],
      [Markup.button.callback("💰 ₹2,50,000", "budget_25")],
    ])
  );
});

// ================= BUDGET =================
const budgets = {
  budget_20: "₹20,000",
  budget_50: "₹50,000",
  budget_1: "₹1,00,000",
  budget_25: "₹2,50,000",
};

bot.action(Object.keys(budgets), async (ctx) => {
  const id = ctx.from.id;
  save(id, "budget", budgets[ctx.update.callback_query.data]);

  if (users[id].service === "Premium Channel") {
    await ctx.reply(
`✅ Question 4:
Aap kaunsi premium plan lena chahoge?`,
      Markup.inlineKeyboard([
        [Markup.button.callback("🔥 ₹3,999 – Premium", "p1")],
        [Markup.button.callback("🔥 ₹7,999 – Advanced", "p2")],
        [Markup.button.callback("⭐ ₹21,999 – Lifetime", "p3")],
      ])
    );
  } else {
    await ctx.reply(
`✅ Question 4:
Account handling ke liye kitna capital allocate karoge?`,
      Markup.inlineKeyboard([
        [Markup.button.callback("💼 ₹25,000", "a1")],
        [Markup.button.callback("💼 ₹50,000", "a2")],
        [Markup.button.callback("💼 ₹1,00,000", "a3")],
        [Markup.button.callback("💼 ₹2,50,000", "a4")],
      ])
    );
  }
});

// PREMIUM PLANS
const plans = {
  p1: "₹3,999 Premium",
  p2: "₹7,999 Advanced",
  p3: "₹21,999 Lifetime",
};

bot.action(Object.keys(plans), async (ctx) => {
  const id = ctx.from.id;
  save(id, "premium_plan", plans[ctx.update.callback_query.data]);
  save(id, "account_capital", "Not Applicable");
  await finalStep(ctx);
});

// ACCOUNT CAPITAL
const capital = {
  a1: "₹25,000",
  a2: "₹50,000",
  a3: "₹1,00,000",
  a4: "₹2,50,000",
};

bot.action(Object.keys(capital), async (ctx) => {
  const id = ctx.from.id;
  save(id, "account_capital", capital[ctx.update.callback_query.data]);
  save(id, "premium_plan", "Not Applicable");
  await finalStep(ctx);
});

// ================= SAVE =================
async function finalStep(ctx) {
  const id = ctx.from.id;

  await sheet.addRow({
    "User ID": id,
    Name: ctx.from.first_name || "",
    Username: ctx.from.username || "",
    "Market Interest": users[id].market,
    "Service Type": users[id].service,
    "Budget": users[id].budget,
    "Premium Selection": users[id].premium_plan,
    "Account Handling Capital": users[id].account_capital,
    "Date & Time": new Date().toLocaleString(),
  });

  await ctx.reply(
`🎉 Special Limited-Time Offer!

Agar aap admin ko comment karte ho 👇
👉 ce&pe25

Toh aapko premium plans par **50% discount** milega 🎁

📩 Next Step:
Admin ko **ce&pe25** send karein
Aur team aapse contact karegi 🙌

🔗 Admin Contact:
https://t.me/TRADEwithSHAANVii`
  );
}

(async () => {
  await initSheet();
  bot.launch();
  console.log("BOT LIVE 🚀");
})();

const { Telegraf, Markup } = require("telegraf");
const { GoogleSpreadsheet } = require("google-spreadsheet");
const { GoogleAuth } = require("google-auth-library");

const bot = new Telegraf(process.env.BOT_TOKEN);

const SHEET_ID = process.env.SHEET_ID;
let sheet;

// GOOGLE SHEET CONNECT
async function initSheet() {
  try {
    const auth = new GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const authClient = await auth.getClient();

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

initSheet();

let users = {};
function save(id, key, value) {
  if (!users[id]) users[id] = {};
  users[id][key] = value;
}


// START
bot.start(async (ctx) => {
  const id = ctx.from.id;
  users[id] = {};

  await ctx.reply(
`Welcome to Ce & Pe EduempireX 📈

Hum stock market me kaafi time se active aur experienced team hain.
Market ke real-time experience ke base par insights aur tips provide karte hain.

Aapke liye best option suggest karne ke liye
please neeche diye gaye questions ka reply karein 👇

✅ Question 1: Market Interest
1️⃣ Aap kis market me interest rakhte ho?`,
    Markup.inlineKeyboard([
      [Markup.button.callback("📊 Stock Market", "market_stock")],
      [Markup.button.callback("💱 Forex Market", "market_forex")],
    ])
  );
});

// MARKET
bot.action(["market_stock", "market_forex"], async (ctx) => {
  const id = ctx.from.id;

  save(
    id,
    "market",
    ctx.update.callback_query.data.includes("stock")
      ? "Stock Market"
      : "Forex Market"
  );

  await ctx.editMessageText(
`✅ Question 2: Service Type Selection
2️⃣ Aap kaunsa option choose karna chahoge?`,
    Markup.inlineKeyboard([
      [Markup.button.callback("📘 Premium Channel", "service_premium")],
      [Markup.button.callback("🤝 Account Handling", "service_account")],
    ])
  );
});

// SERVICE PREMIUM
bot.action("service_premium", async (ctx) => {
  save(ctx.from.id, "service", "Premium Channel");

  await ctx.editMessageText(
`✅ Question 3: Monthly Budget Range
3️⃣ Aap monthly approx kitna capital allocate karna chahte ho?`,
    Markup.inlineKeyboard([
      [Markup.button.callback("💰 ₹20,000", "budget_20")],
      [Markup.button.callback("💰 ₹50,000", "budget_50")],
      [Markup.button.callback("💰 ₹1,00,000", "budget_1")],
      [Markup.button.callback("💰 ₹2,50,000", "budget_25")],
    ])
  );
});

// SERVICE ACCOUNT
bot.action("service_account", async (ctx) => {
  save(ctx.from.id, "service", "Account Handling");

  await ctx.editMessageText(
`✅ Question 3: Monthly Budget Range
3️⃣ Aap monthly approx kitna capital allocate karna chahte ho?`,
    Markup.inlineKeyboard([
      [Markup.button.callback("💰 ₹20,000", "budget_20")],
      [Markup.button.callback("💰 ₹50,000", "budget_50")],
      [Markup.button.callback("💰 ₹1,00,000", "budget_1")],
      [Markup.button.callback("💰 ₹2,50,000", "budget_25")],
    ])
  );
});


// BUDGET
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
    await ctx.editMessageText(
`✅ Question 4A: Premium Service Selection
4️⃣ Aap humari kaunsi premium service choose karna chahoge?`,
      Markup.inlineKeyboard([
        [Markup.button.callback("🔥 ₹3,999 – Premium", "p_3999")],
        [Markup.button.callback("🔥 ₹7,999 – Advanced", "p_7999")],
        [Markup.button.callback("⭐ ₹21,999 – Lifetime", "p_21999")],
      ])
    );
  } else {
    await ctx.editMessageText(
`✅ Question 4B: Account Handling Capital
4️⃣ Account handling ke liye aap kitna capital allocate kar sakte ho?`,
      Markup.inlineKeyboard([
        [Markup.button.callback("💼 ₹25,000", "a_25")],
        [Markup.button.callback("💼 ₹50,000", "a_50")],
        [Markup.button.callback("💼 ₹1,00,000", "a_1")],
        [Markup.button.callback("💼 ₹2,50,000", "a_25l")],
      ])
    );
  }
});


// PREMIUM
const plans = {
  p_3999: "₹3,999 Premium",
  p_7999: "₹7,999 Advanced",
  p_21999: "₹21,999 Lifetime",
};

bot.action(Object.keys(plans), async (ctx) => {
  const id = ctx.from.id;
  save(id, "premium_plan", plans[ctx.update.callback_query.data]);
  save(id, "account_capital", "Not Applicable");

  await finalStep(ctx);
});


// ACCOUNT CAPITAL
const capitals = {
  a_25: "₹25,000",
  a_50: "₹50,000",
  a_1: "₹1,00,000",
  a_25l: "₹2,50,000",
};

bot.action(Object.keys(capitals), async (ctx) => {
  const id = ctx.from.id;
  save(id, "account_capital", capitals[ctx.update.callback_query.data]);
  save(id, "premium_plan", "Not Applicable");

  await finalStep(ctx);
});


// SAVE
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

  await ctx.editMessageText(
`🎉 Special Limited-Time Offer!

Agar aap admin ko comment karte ho 👇
👉 ce&pe25

Toh aapko premium plans par **50% ka special discount** milega.

📩 Next Step:
Please admin ko **ce&pe25** comment karein,
aur hamari team aapse directly connect karegi 🙌

🔗 Admin Contact:
https://t.me/TRADEwithSHAANVii`
  );
}

bot.launch();
console.log("BOT LIVE 🚀");

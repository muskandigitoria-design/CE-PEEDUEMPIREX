const { Telegraf, Markup } = require("telegraf");
const { GoogleSpreadsheet } = require("google-spreadsheet");
const creds = require("./credentials.json");

// ================== BOT TOKEN ==================
const bot = new Telegraf(process.env.BOT_TOKEN);

// ================= GOOGLE SHEET SETUP =================
const SHEET_ID = process.env.SHEET_ID;
let sheet;

async function initSheet() {
  try {
    const doc = new GoogleSpreadsheet(SHEET_ID);

    await doc.useServiceAccountAuth({
      client_email: creds.client_email,
      private_key: creds.private_key.replace(/\\n/g, "\n"),
    });

    await doc.loadInfo();
    sheet = doc.sheetsByIndex[0];

    // ================= ADD HEADINGS HERE =================
    await sheet.setHeaderRow([
      "User ID",
      "Name",
      "Username",
      "Market Interest",
      "Budget",
      "Service Type",
      "Premium Selection",
      "Account Handling Capital",
      "Date Time",
    ]);

    console.log("Google Sheet Connected & Headings Added 👍");
  } catch (err) {
    console.log("Sheet Error:", err);
  }
}

initSheet();

// ================= USER DATA MEMORY =================
let users = {};

function saveData(id, key, value) {
  if (!users[id]) users[id] = {};
  users[id][key] = value;
}

// ================= START MESSAGE =================
bot.start(async (ctx) => {
  const id = ctx.from.id;
  users[id] = {};

  await ctx.reply(
    "Welcome to Ce & Pe EduempireX 📈\n\n" +
      "Hum stock market me kaafi time se active aur experienced team hain.\n" +
      "Market ke real-time experience ke base par insights aur tips provide karte hain.\n" +
      "Aapke liye best option suggest karne ke liye, please neeche diye gaye questions ka reply karein 👇"
  );

  await ctx.reply(
    "✅ Question 1: Market Interest\n1️⃣ Aap kis market me interest rakhte ho?",
    Markup.keyboard([["📊 Stock Market"], ["💱 Forex Market"]]).resize()
  );
});

// ================= HANDLE RESPONSES =================
bot.hears(["📊 Stock Market", "💱 Forex Market"], async (ctx) => {
  saveData(ctx.from.id, "market", ctx.message.text);

  await ctx.reply(
    "✅ Question 2: Monthly Budget Range\n2️⃣ Aap monthly approx kitna capital allocate karna chahte ho?",
    Markup.keyboard([
      ["💰 ₹20,000", "💰 ₹50,000"],
      ["💰 ₹1,00,000", "💰 ₹2,50,000"],
    ]).resize()
  );
});

bot.hears(
  ["💰 ₹20,000", "💰 ₹50,000", "💰 ₹1,00,000", "💰 ₹2,50,000"],
  async (ctx) => {
    saveData(ctx.from.id, "budget", ctx.message.text);

    await ctx.reply(
      "✅ Question 3: Service Type Selection\n3️⃣ Aap kaunsa option choose karna chahoge?",
      Markup.keyboard([["📘 Premium Channel"], ["🤝 Account Handling"]]).resize()
    );
  }
);

// ================= PREMIUM =================
bot.hears("📘 Premium Channel", async (ctx) => {
  saveData(ctx.from.id, "service", "Premium Channel");

  await ctx.reply(
    "✅ Question 4A: Premium Service Selection\n4️⃣ Aap humari kaunsi premium service choose karna chahoge?",
    Markup.keyboard([
      ["🔥 ₹3,999 – Premium Channel"],
      ["🔥 ₹7,999 – Advanced Premium Channel"],
      ["⭐ ₹21,999 – Lifetime Premium Channel"],
    ]).resize()
  );
});

bot.hears(
  [
    "🔥 ₹3,999 – Premium Channel",
    "🔥 ₹7,999 – Advanced Premium Channel",
    "⭐ ₹21,999 – Lifetime Premium Channel",
  ],
  async (ctx) => {
    saveData(ctx.from.id, "premium_plan", ctx.message.text);
    saveData(ctx.from.id, "account_capital", "Not Applicable");

    await finalResponse(ctx);
  }
);

// ================= ACCOUNT HANDLING =================
bot.hears("🤝 Account Handling", async (ctx) => {
  saveData(ctx.from.id, "service", "Account Handling");

  await ctx.reply(
    "5️⃣ Account handling ke liye aap kitna capital allocate kar sakte ho?",
    Markup.keyboard([
      ["💼 ₹25,000", "💼 ₹50,000"],
      ["💼 ₹1,00,000", "💼 ₹2,50,000"],
    ]).resize()
  );
});

bot.hears(
  ["💼 ₹25,000", "💼 ₹50,000", "💼 ₹1,00,000", "💼 ₹2,50,000"],
  async (ctx) => {
    saveData(ctx.from.id, "account_capital", ctx.message.text);
    saveData(ctx.from.id, "premium_plan", "Not Applicable");

    await finalResponse(ctx);
  }
);

// ================= SAVE TO SHEET =================
async function finalResponse(ctx) {
  const id = ctx.from.id;

  await sheet.addRow({
    "User ID": id,
    Name: ctx.from.first_name || "",
    Username: ctx.from.username || "",
    "Market Interest": users[id].market,
    Budget: users[id].budget,
    "Service Type": users[id].service,
    "Premium Selection": users[id].premium_plan,
    "Account Handling Capital": users[id].account_capital,
    "Date Time": new Date().toLocaleString(),
  });

  await ctx.reply(
    "🎉 Special Limited-Time Offer!\n" +
      "Agar aap admin ko comment karte ho 👇\n👉 ce&pe25\n" +
      "Toh aapko premium plans par **50% ka special discount** milega.\n\n" +
      "📩 Next Step:\nPlease admin ko **ce&pe25** comment karein,\n" +
      "aur hamari team aapse directly connect karegi 🙌\n\n" +
      "📢 Admin Telegram Channel:\nhttps://t.me/TRADEwithSHAANVii"
  );
}

bot.launch();
console.log("Bot Running...");

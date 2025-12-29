const { Telegraf, Markup } = require("telegraf");
const { GoogleSpreadsheet } = require("google-spreadsheet");

// BOT
const bot = new Telegraf(process.env.BOT_TOKEN);

// SHEET
const SHEET_ID = process.env.SHEET_ID;
let sheet;

// ================= GOOGLE SHEET CONNECT =================
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
      "Budget",
      "Service Type",
      "Premium Plan",
      "Account Handling Confirm",
      "Account Capital",
      "Date & Time"
    ]);

    console.log("Sheet Connected 🟢");
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

Hum stock market me kaafi time se active aur experienced team hain.
Market ke real-time experience ke base par insights aur tips provide karte hain.

Aapke liye best option suggest karne ke liye
please neeche diye gaye questions ka reply karein 👇

✅ Question 1: Market Interest
1️⃣ Aap kis market me interest rakhte ho?`,
Markup.inlineKeyboard([
  [Markup.button.callback("📊 Stock Market", "market_stock")],
  [Markup.button.callback("💱 Forex Market", "market_forex")]
]))
});

// ================= Q1 MARKET =================
bot.action(["market_stock","market_forex"], async(ctx)=>{
  const id = ctx.from.id;

  save(id,"market",
    ctx.update.callback_query.data.includes("stock")
    ? "Stock Market"
    : "Forex Market"
  );

  await ctx.reply(
`✅ Question 2: Monthly Budget Range
2️⃣ Aap monthly approx kitna capital allocate karna chahte ho?`,
Markup.inlineKeyboard([
  [Markup.button.callback("💰 ₹20,000","b20")],
  [Markup.button.callback("💰 ₹50,000","b50")],
  [Markup.button.callback("💰 ₹1,00,000","b1")],
  [Markup.button.callback("💰 ₹2,50,000","b25")]
]))
});

// ================= Q2 BUDGET =================
const budgetMap = {
  b20:"₹20,000",
  b50:"₹50,000",
  b1:"₹1,00,000",
  b25:"₹2,50,000"
};

bot.action(Object.keys(budgetMap),async(ctx)=>{
  const id = ctx.from.id;
  save(id,"budget",budgetMap[ctx.update.callback_query.data]);

  await ctx.reply(
`✅ Question 3: Service Type Selection
3️⃣ Aap kaunsa option choose karna chahoge?`,
Markup.inlineKeyboard([
  [Markup.button.callback("📘 Premium Channel","premium")],
  [Markup.button.callback("🤝 Account Handling","account")]
]))
});

// ================= PREMIUM =================
bot.action("premium",async(ctx)=>{
  save(ctx.from.id,"service","Premium Channel");

  await ctx.reply(
`✅ Question 4A: Premium Service Selection
4️⃣ Aap humari kaunsi premium service choose karna chahoge?`,
Markup.inlineKeyboard([
  [Markup.button.callback("🔥 ₹3,999 – Premium","p3999")],
  [Markup.button.callback("🔥 ₹7,999 – Advanced","p7999")],
  [Markup.button.callback("⭐ ₹21,999 – Lifetime","p21999")]
]))
});

const plans = {
  p3999:"₹3,999 Premium",
  p7999:"₹7,999 Advanced",
  p21999:"₹21,999 Lifetime"
};

bot.action(Object.keys(plans),async(ctx)=>{
  const id = ctx.from.id;
  save(id,"premium_plan",plans[ctx.update.callback_query.data]);
  save(id,"account_confirm","Not Applicable");
  save(id,"account_capital","Not Applicable");
  await finalStep(ctx);
});

// ================= ACCOUNT HANDLING =================
bot.action("account",async(ctx)=>{
  save(ctx.from.id,"service","Account Handling");

  await ctx.reply(
`✅ Question 4B: Account Handling Confirmation
4️⃣ Kya aap account handling service karwana chahte ho?`,
Markup.inlineKeyboard([
  [Markup.button.callback("✅ Yes, Account Handling","yes_acc")],
  [Markup.button.callback("❌ No, Only Premium","no_acc")]
]))
});

bot.action("no_acc",async(ctx)=>{
  save(ctx.from.id,"account_confirm","Denied");
  save(ctx.from.id,"account_capital","Not Applicable");
  save(ctx.from.id,"premium_plan","Not Selected");
  await finalStep(ctx);
});

bot.action("yes_acc",async(ctx)=>{
  save(ctx.from.id,"account_confirm","Confirmed");

  await ctx.reply(
`✅ Question 5: Account Handling Capital
5️⃣ Account handling ke liye aap kitna capital allocate kar sakte ho?`,
Markup.inlineKeyboard([
  [Markup.button.callback("💼 ₹25,000","c25")],
  [Markup.button.callback("💼 ₹50,000","c50")],
  [Markup.button.callback("💼 ₹1,00,000","c1")],
  [Markup.button.callback("💼 ₹2,50,000","c25l")]
]))
});

const caps = {
  c25:"₹25,000",
  c50:"₹50,000",
  c1:"₹1,00,000",
  c25l:"₹2,50,000"
};

bot.action(Object.keys(caps),async(ctx)=>{
  const id = ctx.from.id;
  save(id,"account_capital",caps[ctx.update.callback_query.data]);
  save(id,"premium_plan","Not Applicable");
  await finalStep(ctx);
});

// ================= SAVE + FINAL =================
async function finalStep(ctx){
  const id = ctx.from.id;

  await sheet.addRow({
    "User ID":id,
    Name:ctx.from.first_name || "",
    Username:ctx.from.username || "",
    "Market Interest":users[id].market,
    "Budget":users[id].budget,
    "Service Type":users[id].service,
    "Premium Plan":users[id].premium_plan || "N/A",
    "Account Handling Confirm":users[id].account_confirm || "N/A",
    "Account Handling Capital":users[id].account_capital || "N/A",
    "Date & Time":new Date().toLocaleString(),
  });

  await ctx.reply(
`🎉 Special Limited-Time Offer!

Agar aap admin ko comment karte ho 👇  
👉 ce&pe25

Toh aapko premium plans par **50% ka special discount** milega 🎁

📩 Next Step:
Admin ko **ce&pe25** send karein
Aur team aapse contact karegi 🙌

🔗 Admin Contact:
https://t.me/TRADEwithSHAANVii`
  );
}

// ================= START BOT =================
(async()=>{
  await initSheet();
  bot.launch();
  console.log("BOT LIVE 🚀");
})();

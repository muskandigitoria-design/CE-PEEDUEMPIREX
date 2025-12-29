require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");
const { GoogleSpreadsheet } = require("google-spreadsheet");

const creds = {
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
  private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
};

const bot = new Telegraf(process.env.BOT_TOKEN);

// ============= GOOGLE SHEET SETUP =============
const doc = new GoogleSpreadsheet(process.env.SHEET_ID);
let sheet;

async function initSheet() {
  await doc.useServiceAccountAuth(creds);
  await doc.loadInfo();
  sheet = doc.sheetsByIndex[0];

  await sheet.setHeaderRow([
    "Name",
    "Username",
    "Profile Link",
    "Market Interest",
    "Service Type",
    "Premium Plan",
    "Account Handling Capital",
    "Date & Time (IST)"
  ]);

  console.log("Sheet Connected ✔️");
}

// ============= USER STORAGE =============
let users = {};
function save(id, key, value) {
  if (!users[id]) users[id] = {};
  users[id][key] = value;
}

async function safe(ctx) {
  try { await ctx.answerCbQuery(); } catch {}
}

// ================= START =================
bot.start(async (ctx) => {
  users[ctx.from.id] = {};

  await ctx.reply(
`*✨ WELCOME TO CE & PE EDUEMPIREX 📈*

Hum stock market me experienced team hain  
aur real-time market based guidance provide karte hain.

Best option choose karne ke liye  
please simple questions ka answer dijiye 👇`,
{ parse_mode: "Markdown" }
);

  await ctx.reply(
`*✅ QUESTION 1: MARKET INTEREST*
1️⃣ Aap kis market me interested ho?`,
{
  parse_mode:"Markdown",
  ...Markup.inlineKeyboard([
    [Markup.button.callback("📊 Stock Market","market_stock")],
    [Markup.button.callback("💱 Forex Market","market_forex")]
  ])
});
});

// ================= MARKET =================
bot.action(["market_stock","market_forex"], async(ctx)=>{
  await safe(ctx);
  const id = ctx.from.id;

  save(
    id,
    "market",
    ctx.callbackQuery.data === "market_stock"
    ? "Stock Market"
    : "Forex Market"
  );

  await ctx.reply(
`*✅ QUESTION 2: SERVICE TYPE SELECTION*
2️⃣ Aap kaunsa service chahoge?`,
{
  parse_mode:"Markdown",
  ...Markup.inlineKeyboard([
    [Markup.button.callback("📘 Premium Channel","premium")],
    [Markup.button.callback("🤝 Account Handling","account")]
  ])
});
});

// ================= PREMIUM FLOW =================
bot.action("premium",async(ctx)=>{
  await safe(ctx);
  save(ctx.from.id,"service","Premium Channel");

  await ctx.reply(
`*✅ PREMIUM PLAN SELECTION*
4️⃣ Kaunsa premium plan choose karoge?`,
{
  parse_mode:"Markdown",
  ...Markup.inlineKeyboard([
    [Markup.button.callback("🔥 ₹3,999 Premium (50% OFF)","p3999")],
    [Markup.button.callback("🔥 ₹7,999 Advanced (50% OFF)","p7999")],
    [Markup.button.callback("⭐ ₹21,999 Lifetime (50% OFF)","p21999")]
  ])
});
});

const plans={
  p3999:"₹3,999 Premium (50% OFF)",
  p7999:"₹7,999 Advanced (50% OFF)",
  p21999:"₹21,999 Lifetime (50% OFF)"
};

bot.action(Object.keys(plans),async(ctx)=>{
  await safe(ctx);
  const id = ctx.from.id;

  save(id,"premium_plan",plans[ctx.callbackQuery.data]);
  save(id,"account_capital","N/A");

  await finalStep(ctx);
});

// ================= ACCOUNT HANDLING =================
bot.action("account",async(ctx)=>{
  await safe(ctx);
  save(ctx.from.id,"service","Account Handling");
  save(ctx.from.id,"premium_plan","N/A");

  await ctx.reply(
`*✅ ACCOUNT HANDLING CAPITAL*
4️⃣ Kitna capital allocate kar sakte ho?`,
{
  parse_mode:"Markdown",
  ...Markup.inlineKeyboard([
    [Markup.button.callback("💼 ₹25,000","c25")],
    [Markup.button.callback("💼 ₹50,000","c50")],
    [Markup.button.callback("💼 ₹1,00,000","c1")],
    [Markup.button.callback("💼 ₹2,50,000","c25l")]
  ])
});
});

const caps={
  c25:"₹25,000",
  c50:"₹50,000",
  c1:"₹1,00,000",
  c25l:"₹2,50,000"
};

bot.action(Object.keys(caps),async(ctx)=>{
  await safe(ctx);
  const id = ctx.from.id;

  save(id,"account_capital",caps[ctx.callbackQuery.data]);
  await finalStep(ctx);
});

// ================= SAVE & FINAL MESSAGE =================
async function finalStep(ctx){
  const id = ctx.from.id;

  try{
    await sheet.addRow({
      "Name": ctx.from.first_name || "",
      "Username": ctx.from.username || "N/A",
      "Profile Link": ctx.from.username ? "https://t.me/"+ctx.from.username : "N/A",
      "Market Interest": users[id].market || "",
      "Service Type": users[id].service || "",
      "Premium Plan": users[id].premium_plan || "N/A",
      "Account Handling Capital": users[id].account_capital || "N/A",
      "Date & Time (IST)": new Date().toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})
    });

    console.log("Saved ✔️");
  } catch(e){
    console.log("Sheet Error ❌",e);
  }

  await ctx.reply(
`🎉 *SPECIAL LIMITED TIME OFFER!*

Agar aap admin ko comment karte ho 👇  
👉 *ce&pe25*

Toh aapko premium plans par *50% discount* milega 🎁

📩 *NEXT STEP*
Admin ko message karein  
Team aapse directly connect karegi 😊`,
{
  parse_mode:"Markdown",
  ...Markup.inlineKeyboard([
    [Markup.button.url("📩 Contact Admin","https://t.me/TRADEwithSHAANVii")]
  ])
});
}

// ================= RUN BOT =================
(async()=>{
  await initSheet();
  bot.launch();
  console.log("BOT LIVE 🚀");
})();

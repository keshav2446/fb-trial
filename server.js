// import express from "express";
// import bodyParser from "body-parser";
// import axios from "axios";

// const app = express();
// app.use(bodyParser.json());

// const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
// const VERIFY_TOKEN = process.env.VERIFY_TOKEN;


// app.get("/", (req, res) => {
//   res.send("Messenger bot is running 🚀");
// });


// app.get("/webhook", (req, res) => {
//   const mode = req.query["hub.mode"];
//   const token = req.query["hub.verify_token"];
//   const challenge = req.query["hub.challenge"];

//   if (mode === "subscribe" && token === VERIFY_TOKEN) {
//     console.log("Webhook verified");
//     return res.status(200).send(challenge);
//   }
//   return res.sendStatus(403);
// });


// app.post("/webhook", async (req, res) => {
//   const entry = req.body.entry?.[0];
//   const event = entry?.messaging?.[0];

//   if (!event) return res.sendStatus(200);

//   const senderId = event.sender.id;

//   if (event.message?.text) {
//     const text = event.message.text;
//     console.log("Message received:", text);
//     await sendMessage(senderId, `You said: ${text}`);
//   }

//   res.status(200).send("EVENT_RECEIVED");
// });


// async function sendMessage(senderId, text) {
//   try {
//     const response = await axios.post(
//       "https://graph.facebook.com/v18.0/me/messages",
//       {
//         recipient: { id: senderId },
//         message: { text }
//       },
//       {
//         params: {
//           access_token: process.env.PAGE_ACCESS_TOKEN
//         }
//       }
//     );

//     console.log("Message sent:", response.data);
//   } catch (err) {
//     console.error(
//       "Send message error:",
//       err.response?.data || err.message
//     );
//   }
// }


// const PORT = process.env.PORT || 10000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

import express from "express";
import bodyParser from "body-parser";
import axios from "axios";

const app = express();
app.use(bodyParser.json());

/* ================= ENV ================= */

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// WhatsApp (TEST MODE)
const WA_PHONE_NUMBER_ID = process.env.WA_PHONE_NUMBER_ID;
const WA_TEMP_TOKEN = process.env.WA_TEMP_TOKEN;

/* ================= HEALTH ================= */

app.get("/", (req, res) => {
  res.send("FB + WhatsApp bot running 🚀");
});

/* ================= WEBHOOK VERIFY ================= */

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

/* ================= HELPERS ================= */

function normalize(text) {
  return text.toLowerCase().trim();
}

/* ================= FACEBOOK SEND ================= */

async function sendFBText(senderId, text) {
  await axios.post(
    "https://graph.facebook.com/v18.0/me/messages",
    {
      recipient: { id: senderId },
      message: { text }
    },
    { params: { access_token: PAGE_ACCESS_TOKEN } }
  );
}

async function sendFBImage(senderId, imageUrl) {
  await axios.post(
    "https://graph.facebook.com/v18.0/me/messages",
    {
      recipient: { id: senderId },
      message: {
        attachment: {
          type: "image",
          payload: { url: imageUrl, is_reusable: true }
        }
      }
    },
    { params: { access_token: PAGE_ACCESS_TOKEN } }
  );
}

async function sendFBVideo(senderId, videoUrl) {
  await axios.post(
    "https://graph.facebook.com/v18.0/me/messages",
    {
      recipient: { id: senderId },
      message: {
        attachment: {
          type: "video",
          payload: { url: videoUrl }
        }
      }
    },
    { params: { access_token: PAGE_ACCESS_TOKEN } }
  );
}

async function sendFBTemplate(senderId) {
  await axios.post(
    "https://graph.facebook.com/v18.0/me/messages",
    {
      recipient: { id: senderId },
      message: {
        attachment: {
          type: "template",
          payload: {
            template_type: "generic",
            elements: [
              {
                title: "Facebook Automation Demo",
                subtitle: "Auto replies, leads & chatbot 🤖",
                image_url: "https://picsum.photos/600/400",
                buttons: [
                  {
                    type: "postback",
                    title: "📹 Watch Demo Video",
                    payload: "WATCH_DEMO_VIDEO"
                  },
                  {
                    type: "postback",
                    title: "💰 Pricing",
                    payload: "GET_PRICE"
                  },
                  {
                    type: "postback",
                    title: "📞 Contact",
                    payload: "CONTACT_US"
                  }
                ]
              }
            ]
          }
        }
      }
    },
    { params: { access_token: PAGE_ACCESS_TOKEN } }
  );
}

/* ================= WHATSAPP SEND ================= */

async function sendWhatsAppText(to, text) {
  await axios.post(
    `https://graph.facebook.com/v19.0/${WA_PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text }
    },
    {
      headers: {
        Authorization: `Bearer ${WA_TEMP_TOKEN}`,
        "Content-Type": "application/json"
      }
    }
  );
}

/* ================= WEBHOOK RECEIVE ================= */

app.post("/webhook", async (req, res) => {
  try {
    /* ---------- WHATSAPP ---------- */
    const waMsg =
      req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (waMsg) {
      const from = waMsg.from;
      const text = waMsg.text?.body?.toLowerCase();

      console.log("WA:", text);

      if (["hi", "hello", "hii", "hey"].includes(text)) {
        await sendWhatsAppText(from, "Hello 👋 WhatsApp bot working!");
        return res.sendStatus(200);
      }

      if (text?.includes("price")) {
        await sendWhatsAppText(from, "Pricing ₹499 se start hoti hai 💰");
        return res.sendStatus(200);
      }

      await sendWhatsAppText(
        from,
        "Samajh nahi aaya 😅 hi / price likh ke try karo"
      );
      return res.sendStatus(200);
    }

    /* ---------- FACEBOOK MESSENGER ---------- */
    const event = req.body.entry?.[0]?.messaging?.[0];
    if (!event) return res.sendStatus(200);

    const senderId = event.sender.id;

    if (event.postback) {
      const payload = event.postback.payload;

      if (payload === "WATCH_DEMO_VIDEO") {
        await sendFBText(senderId, "Demo video dekhiye 🎥");
        await sendFBVideo(
          senderId,
          "https://www.w3schools.com/html/mov_bbb.mp4"
        );
      }

      if (payload === "GET_PRICE") {
        await sendFBText(senderId, "Pricing ₹499 se start hoti hai 💰");
      }

      if (payload === "CONTACT_US") {
        await sendFBText(senderId, "WhatsApp: +91XXXXXXXXXX 📞");
      }

      return res.sendStatus(200);
    }

    if (!event.message?.text) return res.sendStatus(200);

    const msg = normalize(event.message.text);
    console.log("FB:", msg);

    if (["hi", "hello", "hii", "hey"].includes(msg)) {
      await sendFBText(senderId, "Hi 👋 Kaise help kar sakta hoon?");
      return res.sendStatus(200);
    }

    if (msg.includes("price")) {
      await sendFBText(senderId, "Humari service ₹499 se start hoti hai 💰");
      return res.sendStatus(200);
    }

    if (msg.includes("automation")) {
      await sendFBText(
        senderId,
        "Hum Facebook & Instagram automation provide karte hain 🤖"
      );
      return res.sendStatus(200);
    }

    if (msg.includes("demo")) {
      await sendFBTemplate(senderId);
      return res.sendStatus(200);
    }

    await sendFBText(
      senderId,
      "Samajh nahi aaya 😅 demo / price / automation likh ke try karo"
    );

    return res.sendStatus(200);
  } catch (err) {
    console.error("Webhook error:", err.response?.data || err.message);
    return res.sendStatus(200);
  }
});

/* ================= START ================= */

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});




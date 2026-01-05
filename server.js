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

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const HF_API_KEY = process.env.HF_API_KEY; // optional

/* ---------------- HEALTH CHECK ---------------- */
app.get("/", (req, res) => {
  res.send("Messenger bot is running 🚀");
});

/* ---------------- WEBHOOK VERIFY ---------------- */
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

/* ---------------- RULE ENGINE ---------------- */

const rules = [
  {
    keywords: ["hi", "hello", "hey"],
    replies: [
      "Hi 👋 Kaise help kar sakta hoon?",
      "Hello 😊 Batao kya madad chahiye?"
    ]
  },
  {
    keywords: ["price", "pricing", "cost"],
    replies: [
      "Humari service ₹499 se start hoti hai 💰"
    ]
  },
  {
    keywords: ["service", "automation", "chatbot"],
    replies: [
      "Hum Facebook & Instagram automation provide karte hain 🤖"
    ]
  },
  {
    keywords: ["contact", "number", "phone"],
    replies: [
      "Aap hume WhatsApp pe contact kar sakte ho 📞"
    ]
  }
];

/* ---------------- HELPERS ---------------- */

function normalize(text) {
  return text.toLowerCase().trim();
}

function randomReply(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRuleReply(message) {
  for (const rule of rules) {
    if (rule.keywords.some(k => message.includes(k))) {
      return randomReply(rule.replies);
    }
  }
  return null;
}

/* ---------------- SEND TEXT ---------------- */

async function sendMessage(senderId, text) {
  await axios.post(
    "https://graph.facebook.com/v18.0/me/messages",
    {
      recipient: { id: senderId },
      message: { text }
    },
    {
      params: { access_token: PAGE_ACCESS_TOKEN }
    }
  );
}

/* ---------------- SEND IMAGE ---------------- */

async function sendImage(senderId, imageUrl) {
  await axios.post(
    "https://graph.facebook.com/v18.0/me/messages",
    {
      recipient: { id: senderId },
      message: {
        attachment: {
          type: "image",
          payload: {
            url: imageUrl,
            is_reusable: true
          }
        }
      }
    },
    {
      params: { access_token: PAGE_ACCESS_TOKEN }
    }
  );
}

/* ---------------- SEND VIDEO ---------------- */

async function sendVideo(senderId, videoUrl) {
  await axios.post(
    "https://graph.facebook.com/v18.0/me/messages",
    {
      recipient: { id: senderId },
      message: {
        attachment: {
          type: "video",
          payload: {
            url: videoUrl
          }
        }
      }
    },
    {
      params: { access_token: PAGE_ACCESS_TOKEN }
    }
  );
}

/* ---------------- OPTIONAL AI (SAFE) ---------------- */

async function getHFReply(userMessage) {
  try {
    const res = await axios.post(
      "https://router.huggingface.co/hf-inference/text-generation/google/gemma-2b-it",
      {
        inputs: userMessage,
        parameters: { max_new_tokens: 100 }
      },
      {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 20000
      }
    );

    return res.data?.[0]?.generated_text;
  } catch {
    return null;
  }
}

/* ---------------- WEBHOOK ---------------- */

app.post("/webhook", async (req, res) => {
  const event = req.body.entry?.[0]?.messaging?.[0];
  if (!event) return res.sendStatus(200);

  const senderId = event.sender.id;

  if (event.message?.text) {
    const userMessage = normalize(event.message.text);

    /* ---- DEMO IMAGE ---- */
    if (userMessage.includes("demo")) {
      await sendMessage(senderId, "Yeh demo image dekhiye 👇");
      await sendImage(
        senderId,
        "https://via.placeholder.com/600x400"
      );
      return res.sendStatus(200);
    }

    /* ---- DEMO VIDEO ---- */
    if (userMessage.includes("video")) {
      await sendMessage(senderId, "Video demo bhej raha hoon 🎥");
      await sendVideo(
        senderId,
        "https://www.w3schools.com/html/mov_bbb.mp4"
      );
      return res.sendStatus(200);
    }

    /* ---- RULE BASED ---- */
    let reply = getRuleReply(userMessage);

    /* ---- AI FALLBACK (OPTIONAL) ---- */
    if (!reply && HF_API_KEY) {
      reply = await getHFReply(userMessage);
    }

    if (!reply) {
      reply = "Thanks for your message 😊 Team aapse contact karegi.";
    }

    await sendMessage(senderId, reply);
  }

  res.sendStatus(200);
});

/* ---------------- START SERVER ---------------- */

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});



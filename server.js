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
    console.log("Webhook verified");
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

/* ---------------- CHATBOT RULE ENGINE ---------------- */

const rules = [
  {
    keywords: ["hi", "hello", "hey", "hii", "hy"],
    replies: [
      "Hi 👋 Kaise help kar sakta hoon?",
      "Hello 😊 Batao kya madad chahiye?",
      "Hey 👋 Welcome! Kya jaan na hai?"
    ]
  },
  {
    keywords: ["price", "pricing", "cost", "rate", "charges"],
    replies: [
      "Humari service ₹499 se start hoti hai 💰",
      "Pricing ₹499 hai. Aapko kis cheez ke liye chahiye?"
    ]
  },
  {
    keywords: ["service", "services", "offer", "kaam"],
    replies: [
      "Hum automation aur chatbot services provide karte hain 🤖",
      "Hum FB / IG automation setup karte hain 💼"
    ]
  },
  {
    keywords: ["contact", "number", "phone", "call"],
    replies: [
      "Aap hume WhatsApp pe contact kar sakte ho 📞",
      "Contact ke liye please message chhod do 😊"
    ]
  },
  {
    keywords: ["time", "timing", "hours", "open"],
    replies: [
      "Hum Monday–Saturday, 10AM–7PM available hain ⏰"
    ]
  },
  {
    keywords: ["location", "address", "office"],
    replies: [
      "Hum online services provide karte hain 🌐"
    ]
  },
  {
    keywords: ["thanks", "thank you", "thx"],
    replies: [
      "Welcome 😊",
      "Aapka swagat hai 🙌"
    ]
  },
  {
    keywords: ["bye", "goodbye", "exit"],
    replies: [
      "Bye 👋 Phir milte hain!",
      "Thank you! 👋"
    ]
  }
];

/* ---------------- HELPER FUNCTIONS ---------------- */

function normalize(text) {
  return text.toLowerCase().trim();
}

function randomReply(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getReply(message) {
  for (const rule of rules) {
    if (rule.keywords.some(keyword => message.includes(keyword))) {
      return randomReply(rule.replies);
    }
  }
  return "Sorry bhai 😅 Samajh nahi aaya. Thoda clear likho please.";
}

/* ---------------- RECEIVE MESSAGE ---------------- */

app.post("/webhook", async (req, res) => {
  const entry = req.body.entry?.[0];
  const event = entry?.messaging?.[0];

  if (!event) return res.sendStatus(200);

  const senderId = event.sender.id;

  if (event.message?.text) {
    const userMessage = normalize(event.message.text);
    console.log("Message received:", userMessage);

    const reply = getReply(userMessage);
    await sendMessage(senderId, reply);
  }

  res.status(200).send("EVENT_RECEIVED");
});

/* ---------------- SEND MESSAGE ---------------- */

async function sendMessage(senderId, text) {
  try {
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
  } catch (err) {
    console.error("Send message error:", err.response?.data || err.message);
  }
}

/* ---------------- START SERVER ---------------- */

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

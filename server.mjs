import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import 'dotenv/config'
import accountRouter from "./routes/account-metafields.mjs"

const app = express();
app.use(express.json());
app.use(cors(
  {
  origin: 'https://lucirajewelry.com', // ✅ allow your frontend
  credentials: true // if you're using cookies/session
}
));

const SHOPIFY_STORE_NAME = process.env.SHOPIFY_STORE_NAME;
const SHOPIFY_STORE_API = process.env.SHOPIFY_STORE_API;

app.use("/api/account", accountRouter)

app.get("/get-store-details", async (req, res) => {
  const query = `
    {
      shop {
        name
        myshopifyDomain
        email
        primaryDomain {
          url
        }
        currencyCode  
      }
    }
  `;

  try {
    const response = await fetch(`https://${SHOPIFY_STORE_NAME}/admin/api/2025-01/graphql.json`, {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": SHOPIFY_STORE_API,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query })
    });

    const data = await response.json();
    console.log(data)
    if (!response.ok) throw new Error(data.errors || "Failed to fetch store details");
    res.json({ success: true, store: data.data.shop });

  } catch (error) {
    console.dir(error, { depth: null })
    res.status(400).json({ error: error.message });
  }
});

app.get("/get-customer-metafields/:customer_id", async (req, res) => {
  const { customer_id } = req.params;

  const query = `
    {
      customer(id: "gid://shopify/Customer/${customer_id}") {
        metafields(first: 10) {
          edges {
            node {
              namespace
              key
              value
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(`https://${SHOPIFY_STORE}/admin/api/2023-10/graphql.json`, {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": ADMIN_API_TOKEN,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.errors || "Failed to fetch customer metafields");

    res.json({ success: true, metafields: data.data.customer.metafields.edges });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});



app.listen(3000, () => console.log("Server running on port 3000"));

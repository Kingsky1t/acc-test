import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import 'dotenv/config'

const app = express();
app.use(express.json());
app.use(cors());

const SHOPIFY_STORE = process.env.SHOPIFY_STORE_NAME
const ADMIN_API_TOKEN = process.env.SHOPIFY_STORE_API

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
    const response = await fetch(`https://${SHOPIFY_STORE}/admin/api/2023-10/graphql.json`, {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": ADMIN_API_TOKEN,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.errors || "Failed to fetch store details");
    console.log(data)
    res.json({ success: true, store: data.data.shop });

  } catch (error) {
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

app.post("/update-customer-metafields", async (req, res) => {
  const { customer_id, metafields } = req.body;

  const formattedMetafields = metafields.map(mf => `
    {
      namespace: "custom",
      key: "${mf.key}",
      value: "${mf.value}",
      type: "${mf.type}"
    }
  `).join(",");

  const mutation = `
    mutation {
      customerUpdate(input: {
        id: "gid://shopify/Customer/${customer_id}",
        metafields: [${formattedMetafields}]
      }) {
        customer {
          metafields(first: 10) {
            edges {
              node {
                key
                value
              }
            }
          }
        }
        userErrors {
          field
          message
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
      body: JSON.stringify({ query: mutation })
    });

    const data = await response.json();
    if (data.errors || data.data.customerUpdate.userErrors.length > 0) {
      throw new Error(data.errors || data.data.customerUpdate.userErrors[0].message);
    }

    res.json({ success: true, metafields: data.data.customerUpdate.customer.metafields.edges });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});



app.listen(3000, () => console.log("Server running on port 3000"));

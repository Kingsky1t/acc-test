import express from 'express';
import { validateUser } from '../middleware.mjs';
const router = express.Router();

const SHOPIFY_STORE = process.env.SHOPIFY_STORE_NAME;
const ADMIN_API_TOKEN = process.env.SHOPIFY_STORE_API;

router.get('/test', (req, res) => {
    res.json({ hello: 'world' });
});

router.post('/update', validateUser, async (req, res) => {
    const { customer_id, firstName, lastName, email, phone, metafields } = req.body;

    const formattedMetafields = metafields
        .map(
            mf =>
                `{
            namespace: "custom",
            key: "${mf.key}",
            value: "${mf.value}",
            type: "${mf.type}"
        }`
        )
        .join(',');

    const mutation = `
      mutation customerUpdate($input: CustomerInput!) {
      customerUpdate(input: $input) {
        customer {
          id
          firstName
          lastName
          email
          phone
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
        userErrors {
          field
          message
        }
      }
    }`;
    const variables = {
        input: {
            id: `gid://shopify/Customer/${customer_id}`,
            firstName,
            lastName,
            email,
            phone,
            metafields: formattedMetafields,
        },
    };

    try {
        const response = await fetch(`https://${SHOPIFY_STORE}/admin/api/2023-10/graphql.json`, {
            method: 'POST',
            headers: {
                'X-Shopify-Access-Token': ADMIN_API_TOKEN,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: mutation, variables }),
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

export default router;

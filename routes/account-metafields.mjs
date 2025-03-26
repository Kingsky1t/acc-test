import express from 'express';
import { validateUser } from '../middleware.mjs';
const router = express.Router();

const SHOPIFY_STORE_NAME = process.env.SHOPIFY_STORE_NAME;
const SHOPIFY_STORE_API = process.env.SHOPIFY_STORE_API;

router.get('/test', (req, res) => {
    res.json({ hello: 'world' });
});

router.post('/update', async (req, res) => {
    const { customer_id, firstName, lastName, email, phone, metafields = [] } = req.body;

    const formattedMetafields = metafields.map(mf => ({
        namespace: 'custom',
        key: `${mf.key}`,
        value: `${mf.value}`,
        type: `${mf.type}`,
    }));

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
    console.dir(variables, {depth: null});
    try {
        const response = await fetch(`https://${SHOPIFY_STORE_NAME}/admin/api/2025-01/graphql.json`, {
            method: 'POST',
            headers: {
                'X-Shopify-Access-Token': SHOPIFY_STORE_API,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: mutation, variables }),
        });

        const data = await response.json();
        console.dir(data, {depth: null});
        if (data.errors || data.data.customerUpdate.userErrors.length > 0) {
            throw new Error(data.errors || data.data.customerUpdate.userErrors[0].message);
        }

        res.json({ success: true, metafields: data.data.customerUpdate.customer.metafields.edges });
    } catch (error) {
        console.dir(error, { depth: null });
        res.status(400).json({ error: error.message });
    }
});

export default router;

export const validateUser = (req, res, next) => {
    try {
        const sessionCustomerId = req.session?.customer_id;
        const requestedCustomerId = req.body?.customer_id;

        // 1. Check if user is logged in
        if (!sessionCustomerId) {
            return res.status(401).json({ error: 'Customer not logged in' });
        }

        // 2. Prevent impersonation
        if (requestedCustomerId && sessionCustomerId !== requestedCustomerId) {
            return res.status(403).json({ error: "Forbidden: Access to another customer's data" });
        }

        // Optional: attach to req context
        req.customerId = sessionCustomerId;

        next();
    } catch (err) {
        console.error('User validation failed:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

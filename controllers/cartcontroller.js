const db = require('../db');

//Get Cart
exports.getCart = (req, res) => {
    const userId = req.session.user ? req.session.user.userId : null; // Check if user is logged in
    if (!userId) {
        return res.redirect('/login'); // Redirect to login page if no user is logged in
    }

    // Query to retrieve cart items
    const sql = `
        SELECT * 
        FROM cart_items 
        JOIN products ON cart_items.cartProductId = products.productId 
        WHERE cartUserId = ?
    `;

    // Query to calculate the total payment
    const sqltotal = `
        SELECT 
            SUM(products.productPrice * cart_items.cartProductQuantity) AS total_payment 
        FROM 
            cart_items 
        JOIN 
            products 
        ON 
            cart_items.cartProductId = products.productId 
        WHERE 
            cart_items.cartUserId = ?
    `;

    // Execute both queries in sequence
    db.query(sql, [userId], (error, cartItems) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving cart items');
        }

        db.query(sqltotal, [userId], (error, totalPaymentResults) => {
            if (error) {
                console.error('Error calculating total payment:', error.message);
                return res.status(500).send('Error calculating total payment.');
            }

            const totalPayment = totalPaymentResults[0].total_payment || 0; // Default to 0 if null

            // Render the cart page with retrieved items and total payment
            res.render('cart', { cart_items: cartItems, total_payment: totalPayment });
        });
    });
};




// Edit quantity of the product in the cart
exports.updateCart = (req, res) => {
    const { quantity, productId } = req.body;
    const userId = req.session.user?.userId;
   
    if (!quantity || isNaN(quantity) || quantity <= 0) {
        return res.status(400).send('Invalid quantity. Please provide a positive number.' );
    }

 
    const sql = `
        UPDATE cart_items 
        SET cartProductQuantity = ? 
        WHERE cartProductId = ? AND cartUserId = ?
    `;

    db.query(sql, [quantity, productId, userId], (error, results) => {
        if (error) {
            console.error('Database update error:', error.message);
            return res.status(500).send('Error updating cart item.' );
        }

        if (results.affectedRows === 0) {
            return res.status(404).send( 'Cart item not found or you do not have access to it.' );
        }


        res.redirect(`/cart/${userId}`);
    });
}




// Delete item from cart
exports.deleteCartItem = (req, res) => {
    const { productId } = req.body;
    const userId = req.session.user?.userId;

    if (!userId) {
        req.flash('error', 'Please log in to manage your cart.');
        return res.redirect('/login');
    }

    const query = 'DELETE FROM cart_items WHERE cartUserId = ? AND cartProductId = ?';

    db.query(query, [userId, productId], (err) => {
        if (err) {
            console.error('Error deleting item:', err);
            req.flash('error', 'Could not delete the item. Please try again.');
            return res.status(500).redirect('/cart');
        }

        req.flash('success', 'Item removed from cart!');
        res.redirect(`/cart/${userId}`);
    });
};

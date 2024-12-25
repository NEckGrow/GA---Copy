const db = require('../db');



exports.getAbout = (req, res) => {
        res.render('About');
    };


exports.getSocial = (req,res) => {
    res.render ('social');
};

exports.getProduct = (req, res) => {
    const productId = req.params.id; // Retrieve product ID from route
    const user = req.session.user || null; // Retrieve user from session if logged in
  
    const sql = `SELECT * FROM products WHERE productId = ?`;
  
    db.query(sql, [productId], (error, results) => {
      if (error) {
        console.error('Database query error:', error.message);
        return res.status(500).send('Error retrieving product');
      }
  
      if (results.length === 0) {
        return res.status(404).send('Product not found');
      }
  
      const product = results[0];
      res.render('product', { product, user });
    });
  };
  
  exports.addCart = (req, res) => {
    const { productId, cartProductQuantity } = req.body;
    const userId = req.session.user.userId;
    const productStock = req.body

    if (!userId) {
        req.flash('error', 'Please log in to add items to your cart.');
        return res.redirect('/login');
    }


    const query = `
        INSERT INTO cart_items (cartUserId, cartProductId, cartProductQuantity) 
        VALUES (?, ?, ?) 
        ON DUPLICATE KEY UPDATE cartProductQuantity = cartProductQuantity + ?
    `;

    db.query(query, [userId, productId, cartProductQuantity, cartProductQuantity], (err) => {
        if (err) {
            console.error('Error adding to cart:', err);
            req.flash('error', 'Could not add item to cart. Please try again.');
            return res.status(500).redirect(`/product/${productId}`);
        }

        req.flash('success', 'Item added to cart!');
        res.redirect(`/categories`);
    });
};



exports.getadminProductPage = (req, res) => {
    const sql = 'SELECT * FROM products JOIN categories ON products.categoryId = categories.categoryId';
    db.query(sql, (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving Products');
        }
        // Send the results as 'products' to the EJS view
        res.render('adminProduct', { products: results });
    });
  };


    // Get categories and render 'add' page
exports.getAddPage = (req, res) => {
    const sql = 'SELECT * FROM categories';
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Error fetching categories:', err);
            return res.status(500).send('Error fetching categories');
        }
        res.render('addProduct', { categories: result });
    });
};

  // Add product
exports.addProduct = (req, res) => {
    const { category, name, price, stock, description } = req.body;
    const image = req.file ? req.file.filename : null;

    const query = 'INSERT INTO products (categoryId, productName, productPrice, productStock, productDescription, productImage) VALUES (?, ?, ?, ?, ?, ?)';
    const values = [category, name, price, stock, description, image];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error inserting product:', err);
            return res.status(500).send('Error inserting product');
        }
        res.redirect('/adminProducts');
    });
};

exports.getEditProduct = (req, res) => {
    const productId = req.params.id;
  
    // Queries
    const productSql = 'SELECT * FROM products WHERE productId = ?';
    const categoriesSql = 'SELECT * FROM categories';
  
    db.query(productSql, [productId], (error, productResults) => {
        if (error) {
            console.error('Database query error (Product):', error.message);
            return res.status(500).send('Error retrieving product');
        }
  
        if (productResults.length > 0) {
            db.query(categoriesSql, (catError, categoryResults) => {
                if (catError) {
                    console.error('Database query error (Categories):', catError.message);
                    return res.status(500).send('Error retrieving categories');
                }
  
                res.render('editProduct', { 
                    product: productResults[0], 
                    categories: categoryResults 
                });
            });
        } else {
            res.status(404).send('Product not found');
        }
    });
  };


  exports.editProduct = (req, res) => {
    const productId = req.params.id;
    const { productName, productDescription, productPrice, productStock, category } = req.body;
    const productImage = req.file ? req.file.filename : req.body.currentImage;

    const updateQuery = `
        UPDATE products 
        SET productName = ?, productDescription = ?, productPrice = ?, productStock = ?, productImage = ?, categoryId = ? 
        WHERE productId = ?`;

    const values = [
        productName,
        productDescription,
        productPrice,
        productStock,
        productImage,
        category,
        productId
    ];

    db.query(updateQuery, values, (err) => {
        if (err) {
            console.error('Error updating product:', err);
            return res.status(500).send('Database update error');
        }
        res.redirect('/adminProducts');
    });
};


exports.deleteProduct = (req, res) => {
    const productId = req.params.id;

    // SQL queries
    const deleteReviewsQuery = 'DELETE FROM reviews WHERE productId = ?';
    const deleteCartItemsQuery = 'DELETE FROM cart_items WHERE cartProductId = ?';
    const deleteProductQuery = 'DELETE FROM products WHERE productId = ?';
    db.query(deleteReviewsQuery, [productId], (reviewsError) => {
        if (reviewsError) {
            console.error('Error deleting reviews:', reviewsError.message);
            return res.status(500).send('Error deleting reviews.');
        }
        db.query(deleteCartItemsQuery, [productId], (cartError) => {
            if (cartError) {
                console.error('Error deleting cart items:', cartError.message);
                return res.status(500).send('Error deleting cart items.');
            }
            db.query(deleteProductQuery, [productId], (productError) => {
                if (productError) {
                    console.error('Error deleting product:', productError.message);
                    return res.status(500).send('Error deleting product.');
                }
                res.redirect('/adminProducts');
            });
        });
    });
};







exports.getProductPage = (req, res) => {
    const categoryId = req.params.id;
    const user = req.session.user;

    // Corrected SQL queries
    const productQuery = `
        SELECT p.productName, p.productImage, c.categoryName ,  p.productPrice, p.productDescription, p.productId
        FROM products p 
        INNER JOIN categories c ON p.categoryId = c.categoryId 
        WHERE c.categoryId = ?`;
    
    const categoryQuery = `SELECT categoryName FROM categories WHERE categoryId = ?`;

    // Execute both queries in parallel
    db.query(productQuery, [categoryId], (err, products) => {
        if (err) {
            console.error('Error fetching product data:', err);
            return res.status(500).send('Server error');
        }

        db.query(categoryQuery, [categoryId], (err, categoryResult) => {
            if (err || categoryResult.length === 0) {
                console.error('Error fetching category data:', err || "Category not found");
                return res.status(500).send('Server error');
            }

            const categoryName = categoryResult[0].categoryName;

            // Render the product page with results
            res.render('productsPage', { products, categoryName, user});
        });
    });
};

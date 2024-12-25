const db = require('../db');


exports.getReviews = (req, res) => {
    const  productId  = req.params.id;
    const userId = req.session.user.userId;

    const sql = `
        SELECT reviews.*, users.username 
        FROM reviews
        JOIN users ON reviews.reviewedByUserId = users.userId
        WHERE productId = ?
    `;
    

    db.query(sql, [productId], (error, results) => {
        if (error) {
            console.error('Error retrieving reviews:', error.message);
            return res.status(500).send('Error retrieving reviews.');
        }
        res.render('reviews', { reviews: results, productId, userId });
    });
};

exports.addReview = (req, res) => {
    const { review, rating, productId} = req.body;
    const reviewuser = req.session.user.userId;
    let image = req.body.image;
    if (req.file) {
        image = req.file.filename; 
    }// If an image is uploaded

    const sql = `
        INSERT INTO reviews 
        (reviewContent, reviewRating, reviewImage, productId, reviewedByUserId) 
        VALUES (?, ?, ?, ?, ?)`;

    db.query(sql, [review, rating, image, productId, reviewuser], (error) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).json({ error: 'Error adding review' });
        }
        res.redirect(`reviews/${productId}`);
    });
};



exports.updateReview = (req, res) => {
    const { reviewId, productId } = req.params;
    const { reviewContent, reviewRating } = req.body;
    const reviewedByUserId = req.session.user.userId;
    const image = req.file ? req.file.filename : req.body.currentImage;

    const sql = `
        UPDATE reviews 
        SET reviewContent = ?, reviewRating = ?, reviewImage = ?
        WHERE reviewId = ? AND reviewedByUserId = ?
    `;

    db.query(sql, [reviewContent, reviewRating, image || null, reviewId, reviewedByUserId], (error, results) => {
        if (error) {
            console.error('Error updating review:', error.message);
            return res.status(500).send('Error updating review.');
        }
        if (results.affectedRows === 0) {
            return res.status(403).send('You can only update your own reviews.');
        }
        res.redirect(`/reviews/${productId}`);
    });
};


exports.deleteReview = (req, res) => {
    const { reviewId, productId } = req.params; // Extract productId and reviewId
    const reviewedByUserId = req.session.user.userId;

    const sql = `
        DELETE FROM reviews
        WHERE reviewId = ? AND reviewedByUserId = ?
    `;

    db.query(sql, [reviewId, reviewedByUserId], (error, results) => {
        if (error) {
            console.error('Error deleting review:', error.message);
            return res.status(500).send('Error deleting review.');
        }
        if (results.affectedRows === 0) {
            return res.status(403).send('You can only delete your own reviews.');
        }
        res.redirect(`/reviews/${productId}`); // Redirect to reviews page for the product
    });
};




exports.getAddReview = (req, res) => {
    const productId = req.params.id;
    const userId = req.session.user ? req.session.user.userId : null;
    const sql = `SELECT * FROM products WHERE productId = ?`

    

    if (!userId) {
        return res.redirect('/login'); // Redirect to login if not logged in
    }

    db.query(sql, [productId], (err, results) => {
        if (err) {
            return res.status(400).send ('error adding review');

        }
        res.render('addreview', {product : results ,productId }); 
    })


};

exports.getUpdateReview = (req, res) => {
    const { reviewId, productId } = req.params;
    const reviewedByUserId = req.session.user.userId;

    const sql = `
        SELECT * 
        FROM reviews 
        WHERE reviewId = ? AND reviewedByUserId = ?
    `;

    db.query(sql, [reviewId, reviewedByUserId], (error, results) => {
        if (error) {
            console.error('Error fetching review for update:', error.message);
            return res.status(500).send('Error fetching review.');
        }

        if (results.length === 0) {
            return res.status(403).send('You can only update your own reviews.');
        }

        // Pass review details and productId to the view
        res.render('editreview', { review: results, productId });
    });
};

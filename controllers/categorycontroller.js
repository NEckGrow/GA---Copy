const db = require('../db');

// category
exports.getCategory = (req, res) => {
    const sql = `
        SELECT *
        FROM categories;
       
    `;
    
    db.query(sql, (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving categories');
        }


        return res.render('category', { categories: results });
    });
};


exports.getAdminCategory = (req, res) => {
    const sql = 'SELECT * FROM categories';
    db.query(sql, (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving Categories');
        }
        res.render('adminCategory', { productcats: results });
    });
};

exports.getaddCategory = (req, res) => {
    res.render('addCategory');
};

exports.addCategory = (req, res) => {
    const { categoryName, categoryDescription } = req.body;
    const categoryImage = req.file ? req.file.filename : null; // Handle file upload if image is provided

    // Validate input
    if (!categoryName || !categoryDescription) {
        console.error('Validation error: Missing required fields');
        return res.status(400).send('Category name and description are required');
    }

    // SQL query to insert a new category
    const sql = 'INSERT INTO categories (categoryName, categoryDescription, categoryImage) VALUES (?, ?, ?)';
    const values = [categoryName, categoryDescription, categoryImage];

    db.query(sql, values, (error, results) => {
        if (error) {
            console.error('Database insertion error:', error.message);
            return res.status(500).send('Error adding category');
        }

        console.log('Category added successfully:', results);
        res.redirect('/adminCategories'); // Redirect to categories page after adding
    });
};

exports.getEditCategory= (req,res) => {
    const CatId = req.params.id;
    const sql = 'SELECT * FROM categories WHERE categoryId = ?';
    db.query(sql, [CatId], (error, results) => {
      if (error) {
        console.error('Database query error:', error.message);
        return res.status(500).send('Error retrieving category');
      }
      if (results.length > 0) {
        res.render('editCategory', { category: results[0] });
      } else {
        res.status(404).send('Category not found');
      }
    });
  };

exports.editCategory = (req, res) => {
    const CatId = req.params.id;
    const { categoryName, categoryDescription } = req.body;
    let image = req.body.currentImage;
    if (req.file) {
        image = req.file.filename; 
    }

    const sql = 'UPDATE categories SET categoryName = ?, categoryDescription = ?, categoryImage = ? WHERE categoryId = ?';

    db.query(sql, [categoryName, categoryDescription, image, CatId], (error, results) => {
        if (error) {
            console.error('Error updating category:', error.message);
            return res.status(500).send('Error updating category');
        } else {
            res.redirect('/adminCategories');
        }
    });
};

exports.deleteCategory = (req, res) => {
    const CategoryId = req.params.id;
    const sql = 'DELETE FROM categories WHERE categoryId = ?';

    db.query(sql, [CategoryId], (error, results) => {
        if (error) {
            console.error('Error deleting category:', error.message);
            return res.status(500).send('Error deleting category');
        } else {
            res.redirect('/adminCategories');
        }
    });
};


    
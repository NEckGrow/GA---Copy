const db = require('../db');

//Home
exports.getHome = (req, res) => {
    const sql = "SELECT * FROM products LIMIT 5;";
    const user = req.session.user;
    db.query(sql, (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving products');
        }
        res.render('index', { products: results, user });
    });
};

exports.getDash= (req, res)=>{

    res.render('dashboard',{
        messages: req.flash('success'),
        errors: req.flash('error')
    }, );
};

exports.getRegister = (req, res) => {
    res.render('register', { messages: req.flash('error'), formData: req.flash('formData')[0] });
};

exports.postRegister = (req, res) => {
    const { username, email, password, role } = req.body;
    let image = req.body.image;

    if (req.file) {
        image = req.file.filename;
    } else {
        image = 'default.png'; 
    }

    const sql = 'INSERT INTO users (username, userEmail, userPassword, userRole, userImage) VALUES (?, ?, SHA1(?), ?, ?)';
    db.query(sql, [username, email, password, role, image], (err) => {
        if (err) {
            console.error(err);
            req.flash('error', 'Error registering user.');
            return res.redirect('/register');
        }
        req.flash('success', 'Registration successful! Please log in.');
        res.redirect('/login');
    });
};

exports.getLogin= (req, res)=>{
    res.render('login',{
        messages: req.flash('success'),
        errors: req.flash('error')
    });
};

exports.postLogin = (req, res) => {
    const { userEmail, userPassword } = req.body;

    // Validate email and password
    if (!userEmail || !userPassword) {
        req.flash('error', 'All fields are required.');
        return res.redirect('/login');
    }

    const sql = 'SELECT * FROM users WHERE userEmail = ? AND userPassword = SHA1(?)';
    db.query(sql, [userEmail, userPassword], (err, results) => {
        if (err) {
            throw err;
        }

        if (results.length > 0) {
            req.session.user = results[0];
            req.flash('success', 'Login successful');

            // Check user role and redirect accordingly
            if (req.session.user.userRole === 'admin') {
                res.redirect('/dashboard');
            } else {
                res.redirect('/');
            }
        } else {
            req.flash('error', 'Invalid email or password.');
            res.redirect('/login');
        }
    });
};

exports.getAccount = (req, res) => {
    const sql = "SELECT * FROM users"; 
    db.query(sql, (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving users');
        }

        const users = results; 
        
        // Get messages from flash or set defaults
        const messages = req.flash('success');
        const errors = req.flash('error');

        res.render('account', { users, messages, errors });     
    });
};
exports.postAccount = (req, res) => {
    console.log('Session User:', req.session.user);
    console.log('Request Body:', req.body);

    const { username, email, password } = req.body;
    let image = req.body.currentImage;
    if (req.file) {
        image = req.file.filename;
    }

    const userId = req.session.user ? req.session.user.userId : null; 
    console.log('User  ID:', userId);

    if (!userId) {
        req.flash('error', 'User  not authenticated.');
        return res.redirect('/'); 
    }

    const sql = 'UPDATE users SET username = ?, userEmail = ?, userPassword = SHA1(?), userImage = ? WHERE userId = ?';
    console.log('SQL Query:', sql);
    console.log('Values:', [username, email, password, image, userId]);

    db.query(sql, [username, email, password, image, userId], (err) => {
        if (err) {
            console.error('Database Error:', err);
            req.flash('error', 'Error updating user information.');
            return res.redirect(`/account/${userId}`);
        }

        // Update session with new user details
        req.session.user.username = username;
        req.session.user.userEmail = email;
        req.session.user.userImage = image;

        // Log the updated session
        console.log('Updated Session User:', req.session.user);

        req.flash('success', 'Account updated successfully!');
        res.redirect(`/`);
    });
};

exports.logout= (req,res)=>{
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Failed to log out');
        }
        res.redirect('/');
    });
}
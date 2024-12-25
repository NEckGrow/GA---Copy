const express = require('express');
const multer = require('multer');
const session = require('express-session');
const flash = require('connect-flash');
const app = express();
const productController = require('./controllers/productscontroller');
const categorycontrol = require('./controllers/categorycontroller');
const cartcontrol = require('./controllers/cartcontroller');
const reviewcontrol = require('./controllers/reviewscontroller');

const usercontrol = require ('./controllers/usercontrol');



// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images'); // Directory to save uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); 
    }
});

const upload = multer({ storage: storage });

// Set up view engine
app.set('view engine', 'ejs');
//  enable static files
app.use(express.static('public'));
// enable form processing
app.use(express.urlencoded({
    extended: false
}));

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }
}));
app.use(flash());

app.use((req, res, next) => {
    res.locals.user = req.session.user || null; 
    next();
});


// Middleware for validation and authentication
const validateRegistration = (req, res, next) => {
    const { username, email, password, image } = req.body;
    if (!username || !email || !password || !image) {
        req.flash('error', 'All fields are required.');
        return res.redirect('/register');
    }
    if (password.length < 6) {
        req.flash('error', 'Password should be at least 6 characters long.');
        req.flash('formData', req.body);
        return res.redirect('/register');
    }
    next();
};



app.get('/', usercontrol.getHome);

app.get('/about',productController.getAbout);

app.get('/social',productController.getSocial);

app.get('/categories' , categorycontrol.getCategory);
app.get('/adminCategories' , categorycontrol.getAdminCategory);
app.get('/addCategory',  categorycontrol.getaddCategory);
app.post('/addCategory', upload.single('categoryImage'), categorycontrol.addCategory);
app.get('/editCategory/:id', categorycontrol.getEditCategory); 
app.post('/editCategory/:id', upload.single('image'), categorycontrol.editCategory);
app.post('/deleteCategory/:id', categorycontrol.deleteCategory);

app.get('/cart/:id', cartcontrol.getCart);
app.post('/cart/delete', cartcontrol.deleteCartItem);
app.post(`/cart/update`, cartcontrol.updateCart);


app.get('/dashboard',usercontrol.getDash );

app.get('/product/:id', productController.getProduct);

app.post('/cart/add', productController.addCart);

app.get('/login', usercontrol.getLogin);
app.post('/login', usercontrol.postLogin); 
app.get('/register', usercontrol.getRegister);
app.post('/register',validateRegistration, usercontrol.postRegister);
app.get('/account/:id', usercontrol.getAccount);
app.post('/account/:id', upload.single('image'), usercontrol.postAccount);

app.post('/logout',usercontrol.logout);


app.get('/adminProducts', productController.getadminProductPage);
app.get('/addProduct', productController.getAddPage);
app.post('/addProduct', upload.single('productImage'), productController.addProduct);
app.get('/editProduct/:id', productController.getEditProduct)
app.post('/editProduct/:id', upload.single('productImage'), productController.editProduct);
app.post('/deleteProduct/:id', productController.deleteProduct);
app.get('/product/category/:id', productController.getProductPage);


app.get('/reviews/:id', reviewcontrol.getReviews);
app.post('/reviewadd', upload.single('reviewImage'), reviewcontrol.addReview);
app.get('/reviews/:id/add', reviewcontrol.getAddReview)
app.post('/reviews/:productId/edit/:reviewId',upload.single('reviewImage'), reviewcontrol.updateReview);
app.post('/reviews/:productId/:reviewId/delete', reviewcontrol.deleteReview);
app.get('/reviews/:productId/edit/:reviewId', reviewcontrol.getUpdateReview);





const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

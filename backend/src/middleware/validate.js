const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: errors.array().map((e) => e.msg).join(', '),
      errors: errors.array(),
    });
  }

  next();
};

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 80 }),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const itemRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 120 }),
  body('sku').trim().notEmpty().withMessage('SKU is required').isLength({ max: 40 }),
  body('category').trim().notEmpty().withMessage('Category is required').isLength({ max: 60 }),
  body('quantity').isFloat({ min: 0 }).withMessage('Quantity must be a non-negative number'),
  body('unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be a non-negative number'),
  body('location').trim().notEmpty().withMessage('Location is required').isLength({ max: 100 }),
];

const itemUpdateRules = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty').isLength({ max: 120 }),
  body('sku').optional().trim().notEmpty().withMessage('SKU cannot be empty').isLength({ max: 40 }),
  body('category')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Category cannot be empty')
    .isLength({ max: 60 }),
  body('quantity')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Quantity must be a non-negative number'),
  body('unitPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a non-negative number'),
  body('location')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Location cannot be empty')
    .isLength({ max: 100 }),
];

module.exports = {
  validate,
  registerRules,
  loginRules,
  itemRules,
  itemUpdateRules,
};

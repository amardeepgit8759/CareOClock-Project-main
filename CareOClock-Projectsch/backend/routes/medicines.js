const express = require('express');
const { getMedicines, createMedicine, updateMedicine, deleteMedicine, getLowStockMedicines } = require('../controllers/medicineController');
const { protect, checkResourceAccess } = require('../middleware/authMiddleware');
console.log({ getMedicines, createMedicine, updateMedicine, deleteMedicine, getLowStockMedicines });
console.log({ protect, checkResourceAccess });

const router = express.Router();

router.use(protect); // protects all routes below this

router.get('/', checkResourceAccess(), getMedicines);
router.post('/', checkResourceAccess(), createMedicine);
router.get('/low-stock', checkResourceAccess(), getLowStockMedicines);

router.get('/:userId', checkResourceAccess(), getMedicines);
router.post('/:userId', checkResourceAccess(), createMedicine);
router.get('/low-stock/:userId', checkResourceAccess(), getLowStockMedicines);

router.patch('/:id', checkResourceAccess(), updateMedicine);
router.delete('/:id', checkResourceAccess(), deleteMedicine);

module.exports = router;

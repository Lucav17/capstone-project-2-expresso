const express = require('express');
const menuItemRouter = express.Router({ mergeParams: true });

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

// Params
menuItemRouter.param('menuItemId', (req, res, next, menuItemId) => {
  const sql = 'SELECT * FROM MenuItem WHERE id = $menuItemId';
  const values = { $menuItemId: menuItemId };
  db.get(sql, values, (err, menuItem) => {
    if (err) {
      next(err);
    } else if (menuItem) {
      req.menuItem = menuItem;
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

// Middleware
const menuItemValidator = (req, res, next) => {
  const menuItem = req.body.menuItem;
  if (!menuItem.name || !menuItem.description || !menuItem.inventory || !menuItem.price) {
    return res.sendStatus(400);
  }

  next();
};

// GET
menuItemRouter.get('/', (req, res, next) => {
  const sql = 'SELECT * FROM MenuItem WHERE MenuItem.menu_id = $menuId';
  const values = { $menuId: req.menu.id };
  db.all(sql, values, (error, menuItems) => {
    if (error) {
      next(error);
    } else {
      res.status(200).json({ menuItems: menuItems });
    }
  });
});

// POST
menuItemRouter.post('/', menuItemValidator, (req, res, next) => {
  const menuItem = req.body.menuItem;
  const sql = `INSERT INTO MenuItem (name, description, inventory, price, menu_id)
                VALUES ($name, $description, $inventory, $price, $menu_id)`;
  const values = {
    $name: menuItem.name,
    $description: menuItem.description,
    $inventory: menuItem.inventory,
    $price: menuItem.price,
    $menu_id: req.menu.id,
  };
  db.run(sql, values, function (err) {
    if (err) {
      next(err);
    } else {
      db.get(`SELECT * FROM MenuItem WHERE id = ${this.lastID}`, (err, data) => {
        res.status(201).json({ menuItem: data });
      });
    }
  });
});

// PUT
menuItemRouter.put('/:menuItemId', menuItemValidator, (req, res, next) => {
  const menuItem = req.body.menuItem;
  const sql = `UPDATE MenuItem SET name = $name, description = $description,
              inventory = $inventory, price = $price, menu_id = $menu_id
                WHERE id = $menuItemId`;
  const values = {
    $name: menuItem.name,
    $description: menuItem.description,
    $inventory: menuItem.inventory,
    $price: menuItem.price,
    $menu_id: req.menu.id,
    $menuItemId: req.params.menuItemId,
  };
  db.run(sql, values, function (err) {
    if (err) {
      next(err);
    } else {
      db.get('SELECT * FROM MenuItem WHERE id = $menuItemId', {
        $menuItemId: req.params.menuItemId,
      }, (err, data) => {
        res.status(200).json({ menuItem: data });
      });
    }
  });
});

// DELETE
menuItemRouter.delete('/:menuItemId', (req, res, next) => {
  const sql = 'DELETE FROM MenuItem WHERE id = $menuItemId';
  const values = { $menuItemId: req.params.menuItemId };
  db.run(sql, values, (err) => {
    if (err) {
      next(err);
    } else {
      res.sendStatus(204);
    }
  });
});

module.exports = menuItemRouter;

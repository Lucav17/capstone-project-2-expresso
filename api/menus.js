const menusRouter = require('express').Router();
const menuItemRouter = require('./menuItems');

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

// Params
menusRouter.param('menuId', (req, res, next, menuId) => {
  const sql = `SELECT * FROM Menu WHERE Menu.id = $menuId`;
  const values = { $menuId: menuId };

  db.get(sql, values, (err, menu) => {
    if (err) {
      next(err);
    } else if (menu) {
      req.menu = menu;
      next();
    } else {
      res.status(404).send();
    }
  });
});

// Middleware
const menuValidator = (req, res, next) => {
  const menu = req.body.menu;
  if (!menu.title) {
    return res.sendStatus(400);
  }

  next();
};

// Menu-Items
menusRouter.use('/:menuId/menu-items', menuItemRouter);

// GET
menusRouter.get('/', (req, res, next) => {
  const sql = `SELECT * FROM Menu`;
  db.all(sql, (err, menus) => {
    if (err) {
      next(err);
    } else {
      res.status(200).json({ menus });
    }
  });
});

menusRouter.get('/:menuId', (req, res, next) => {
  res.status(200).json({ menu: req.menu });
});

// POST
menusRouter.post('/', menuValidator, (req, res, next) => {
  const menu = req.body.menu;
  const sql = `INSERT INTO Menu (title) VALUES ($title)`;
  const values = { $title: menu.title };

  db.run(sql, values, function (err) {
    if (err) {
      next(err);
    } else {
      db.get(`SELECT * FROM Menu WHERE Menu.id = ${this.lastID}`,
        (err, menu) => {
        res.status(201).json({ menu: menu });
      });
    }
  });
});

// PUT
menusRouter.put('/:menuId', menuValidator, (req, res, next) => {
  const menu = req.body.menu;
  const sql = `UPDATE Menu SET title = $title WHERE Menu.id = $menuId`;
  const values = {
    $title: menu.title,
    $menuId: req.params.menuId,
  };

  db.run(sql, values, function (err) {
    if (err) {
      next(err);
    } else {
      db.get(`SELECT * FROM Menu WHERE Menu.id = ${req.params.menuId}`,
        (err, menu) => {
        res.status(200).json({ menu: menu });
      });
    }
  });
});

// DELETE
menusRouter.delete('/:menuId', (req, res, next) => {
  db.get(`SELECT * FROM MenuItem WHERE MenuItem.menu_id = ${req.params.menuId}`,
    (error, menuItem) => {
      if (menuItem) {
        res.sendStatus(400);
      } else {
        const sql = 'DELETE FROM Menu WHERE Menu.id = $menuId';
        const values = { $menuId: req.params.menuId };
        db.run(sql, values, (err) => {
          if (err) {
            next(err);
          }

          res.sendStatus(204);
        });
      }
    });
});

module.exports = menusRouter;

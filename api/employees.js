const employeesRouter = require('express').Router();
const timeSheetsRouter = require('./timeSheets');

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

// Params
employeesRouter.param('employeeId', (req, res, next, employeeId) => {
  const sql = 'SELECT * FROM Employee WHERE Employee.id = $employeeId';
  const values = { $employeeId: employeeId };
  db.get(sql, values, (error, employee) => {
    if (error) {
      next(error);
    } else if (employee) {
      req.employee = employee;
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

// Middleware
const employeeValidator = (req, res, next) => {
  const employee = req.body.employee;
  if (!employee.name || !employee.position || !employee.wage) {
    return res.sendStatus(400);
  }

  next();
};

// Timesheet
employeesRouter.use('/:employeeId/timesheets/', timeSheetsRouter);

// GET
employeesRouter.get('/', (req, res, next) => {
    db.all('SELECT * FROM Employee WHERE Employee.is_current_employee = 1',
     (err, employees) => {
      if (err) {
        next(err);
      } else {
        res.status(200).json({ employees: employees });
      }
    });
  });

employeesRouter.get('/:employeeId', (req, res, next) => {
    res.status(200).json({ employee: req.employee });
  });

// POST
employeesRouter.post('/', employeeValidator, (req, res, next) => {
    const employee = req.body.employee;
    const isCurrentEmployee = employee.isCurrentEmployee === 0 ? 0 : 1;

    const sql = `INSERT INTO Employee (name, position, wage, is_current_employee)
                  VALUES ($name, $position, $wage, $isCurrentEmployee)`;
    const values = {
      $name: employee.name,
      $position: employee.position,
      $wage: employee.wage,
      $isCurrentEmployee: isCurrentEmployee,
    };

    db.run(sql, values, function (error) {
      if (error) {
        next(error);
      } else {
        db.get(`SELECT * FROM Employee WHERE Employee.id = ${this.lastID}`,
       (error, employee) => {
          res.status(201).json({ employee: employee });

        });
      }
    });
  });

// PUT
employeesRouter.put('/:employeeId', employeeValidator, (req, res, next) => {
    const employee = req.body.employee;
    const isCurrentEmployee = employee.isCurrentEmployee === 0 ? 0 : 1;

    const sql = `UPDATE Employee SET name = $name, position = $position,
                  wage = $wage, is_current_employee = $isCurrentEmployee
                  WHERE Employee.id = $employeeId`;
    const values = {
      $name: employee.name,
      $position: employee.position,
      $wage: employee.wage,
      $isCurrentEmployee: isCurrentEmployee,
      $employeeId: req.params.employeeId,
    };

    db.run(sql, values, (error) => {
      if (error) {
        next(error);
      } else {
        db.get(`SELECT * FROM Employee WHERE Employee.id = ${req.params.employeeId}`,
       (error, employee) => {
          res.status(200).json({ employee: employee });
        });
      }
    });
  });

// DELETE
employeesRouter.delete('/:employeeId', (req, res, next) => {
    const sql = `UPDATE Employee SET is_current_employee = 0
                  WHERE Employee.id = $employeeId`;
    const values = { $employeeId: req.params.employeeId };

    db.run(sql, values, (error) => {
      if (error) {
        next(error);
      } else {
        db.get(`SELECT * FROM Employee WHERE Employee.id = ${req.params.employeeId}`,
       (error, employee) => {
            res.status(200).json({ employee: employee });
          });
      }
    });
  });

module.exports = employeesRouter;

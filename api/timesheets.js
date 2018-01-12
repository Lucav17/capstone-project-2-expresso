const timeSheetsRouter = require('express').Router({ mergeParams: true });

const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

// Middleware
const timeSheetValidator = (req, res, next) => {
  const timeSheet = req.body.timesheet;
  if (!timeSheet.date || !timeSheet.hours || !timeSheet.rate) {
    return res.sendStatus(400);
  }

  next();
};

// GET
timeSheetsRouter.get('/', (req, res, next) => {
  const sql = 'SELECT * FROM Timesheet WHERE Timesheet.employee_id = $employeeId';
  const values = {
    $employeeId: req.employee.id,
  };
  db.all(sql, values, (error, timesheets) => {
    if (error) {
      next(error);
    } else {
      res.status(200).json({
        timesheets: timesheets,
      });
    }
  });
});

// POST
timeSheetsRouter.post('/', timeSheetValidator, (req, res, next) => {
  const timeSheet = req.body.timesheet;
  const sql = `INSERT INTO Timesheet (hours, rate, date, employee_id)
                VALUES ($hours, $rate, $date, $employee_id)`;
  const values = {
    $hours: timeSheet.hours,
    $rate: timeSheet.rate,
    $date: timeSheet.date,
    $employee_id: req.employee.id,
  };

  db.run(sql, values, function (error) {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Timesheet WHERE id = ${this.lastID}`,
        (error, timesheet) => {
          res.status(201).json({
            timesheet: timesheet,
          });

        });
    }
  });
});

// PUT
timeSheetsRouter.put('/:timesheetId', timeSheetValidator, (req, res, next) => {
  const timeSheet = req.body.timesheet;

  const sql = `UPDATE Timesheet SET
              hours = $hours,
              rate = $rate,
              date = $date,
              employee_id = $employee_id
                WHERE Timesheet.id = $timesheetId`;
  const values = {
    $hours: timeSheet.hours,
    $rate: timeSheet.rate,
    $date: timeSheet.date,
    $employee_id: req.params.employeeId,
    $timesheetId: req.params.timesheetId,
  };

  db.run(sql, values, (error) => {
    if (error) {
      next(error);
    } else {
      db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${req.params.timesheetId}`,
        (error, timesheet) => {
          if (!timesheet) {
            res.sendStatus(404);
          } else {
            res.status(200).json({
              timesheet: timesheet,
            });
          }
        });
    }
  });
});

// DELETE
timeSheetsRouter.delete('/:timesheetId', (req, res, next) => {
  db.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${req.params.timesheetId}`,
    (error, timesheet) => {
      if (!timesheet) {
        res.sendStatus(404);
      } else {
        const sql = 'DELETE FROM Timesheet WHERE Timesheet.id = $timesheetId';
        const values = {
          $timesheetId: req.params.timesheetId,
        };
        db.run(sql, values, (err) => {
          if (err) {
            next(err);
          } else {
            res.sendStatus(204);
          }
        });
      }
    });
});

module.exports = timeSheetsRouter;

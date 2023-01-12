const express = require(`express`);
const router = express.Router();
const pgController = require(`../controllers/postgresController`);
const bodyParser = require(`body-parser`).json()

// middleware that is specific to this router
router.use((req, res, next) => {
    // console.log(`Time: `, new Date());
    // console.log(`-insert middleware here-`);
    next();
});

router.get(`/`, pgController.getAllActivities);
router.get(`/activities`, pgController.getAllActivities);
router.get(`/activities/:activityId`, pgController.getActivityById);
router.get(`/jags`, pgController.getAllJags);
router.get(`/jags/:projectId`, pgController.getJagByProjectId);
router.put(`/activities`, bodyParser, pgController.updateActivity);
router.put(`/jags`, bodyParser, pgController.updateJag);
router.delete(`/activities/:activityId`, pgController.deleteActivityById);
router.delete(`/jags/:projectId`, pgController.deleteJagByProjectId);
router.get(`/createTables`, pgController.createTables);
router.get(`/dropTables`, pgController.dropTables);

module.exports = router;



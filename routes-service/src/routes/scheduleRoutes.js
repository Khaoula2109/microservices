const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const gatewayAuth = require('../middleware/gatewayAuth');


router.get('/routes', scheduleController.getAllRoutes);
router.get('/routes/:routeId/stops', scheduleController.getStopsForRoute);
router.get('/routes/:routeId/stops/:stopId/schedule', scheduleController.getScheduleForStop);


router.post('/routes', gatewayAuth, scheduleController.createRoute);
router.post('/stops', gatewayAuth, scheduleController.createStop);
router.post('/routes/:routeId/stops', gatewayAuth, scheduleController.linkStopToRoute);
router.post('/routes/:routeId/stops/:stopId/schedule', gatewayAuth, scheduleController.addSchedule);
router.delete('/schedules/:scheduleId', gatewayAuth, scheduleController.deleteSchedule);
router.get('/stops', scheduleController.getAllStops); 


module.exports = router;
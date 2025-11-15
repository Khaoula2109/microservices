const db = require('../models');
const ValidationException = require('../exceptions/ValidationException');
const NotFoundException = require('../exceptions/NotFoundException');
const ConflictException = require('../exceptions/ConflictException');
const { publishEvent } = require('../config/rabbit');

exports.getAllRoutes = async (req, res, next) => {
    try {
        const routes = await db.Route.findAll({ order: [['name', 'ASC']] });
        res.status(200).json({
            success: true,
            data: routes,
            count: routes.length
        });
    } catch (error) {
        next(error);
    }
};

exports.getStopsForRoute = async (req, res, next) => {
    try {
        const { routeId } = req.params;

        const route = await db.Route.findByPk(routeId, {
            include: [{
                model: db.Stop,
                through: { attributes: ['stopOrder'] },
            }],
            order: [
                [db.Stop, db.RouteStop, 'stopOrder', 'ASC']
            ]
        });

        if (!route) {
            throw new NotFoundException("Ligne non trouvée.");
        }

        const stops = route.Stops.map(stop => ({
            id: stop.id,
            name: stop.name,
            latitude: stop.latitude,
            longitude: stop.longitude,
            order: stop.RouteStop.stopOrder
        }));

        res.status(200).json({
            success: true,
            data: stops,
            route: { id: route.id, name: route.name },
            count: stops.length
        });
    } catch (error) {
        next(error);
    }
};

exports.getScheduleForStop = async (req, res, next) => {
    try {
        const { routeId, stopId } = req.params;

        const routeStop = await db.RouteStop.findOne({
            where: { routeId: routeId, stopId: stopId }
        });

        if (!routeStop) {
            throw new NotFoundException("Aucun horaire trouvé pour cet arrêt sur cette ligne.");
        }

        const schedules = await db.Schedule.findAll({
            where: { routeStopId: routeStop.id },
            order: [['dayOfWeek', 'ASC'], ['arrivalTime', 'ASC']]
        });

        res.status(200).json({
            success: true,
            data: schedules,
            routeStop: { id: routeStop.id },
            count: schedules.length
        });
    } catch (error) {
        next(error);
    }
};

exports.createRoute = async (req, res, next) => {
    try {
        const { name, description, startPoint, endPoint } = req.body;

        if (!name) {
            throw new ValidationException("Le nom de la ligne est requis.");
        }

        const newRoute = await db.Route.create({
            name,
            description,
            startPoint,
            endPoint
        });

        res.status(201).json({
            success: true,
            data: newRoute,
            message: "Ligne créée avec succès"
        });
    } catch (error) {  
        if (error.name === 'SequelizeUniqueConstraintError') {
            throw new ConflictException('Une ligne avec ce nom existe déjà.');
        }
        next(error); 
    }
};

exports.createStop = async (req, res, next) => {
    try {
        const { name, latitude, longitude } = req.body;

        if (!name) {
            throw new ValidationException("Le nom de l'arrêt est requis.");
        }

        if (!latitude || !longitude) {
            throw new ValidationException("La latitude et la longitude sont requises.");
        }

        const newStop = await db.Stop.create({
            name,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude)
        });

        res.status(201).json({
            success: true,
            data: newStop,
            message: "Arrêt créé avec succès"
        });
    } catch (error) {
        next(error);
    }
};

exports.linkStopToRoute = async (req, res, next) => {
    try {
        const { routeId } = req.params;
        const { stopId, order } = req.body;

        if (!stopId) {
            throw new ValidationException("L'ID de l'arrêt (stopId) est requis.");
        }

        if (order === undefined || order === null) {
            throw new ValidationException("L'ordre (order) est requis.");
        }

        if (order < 1) {
            throw new ValidationException("L'ordre doit être un nombre positif.");
        }

        const route = await db.Route.findByPk(routeId);
        if (!route) {
            throw new NotFoundException(`Ligne avec ID ${routeId} non trouvée.`);
        }

        const stop = await db.Stop.findByPk(stopId);
        if (!stop) {
            throw new NotFoundException(`Arrêt avec ID ${stopId} non trouvé.`);
        }

        console.log(` Tentative de liaison: Route ${routeId} ("${route.name}") -> Stop ${stopId} ("${stop.name}") -> Ordre ${order}`);

        const link = await db.RouteStop.create({
            routeId: parseInt(routeId),
            stopId: parseInt(stopId),
            stopOrder: parseInt(order)
        });

        res.status(201).json({
            success: true,
            data: link,
            message: `Arrêt "${stop.name}" lié à la ligne "${route.name}" avec succès (ordre ${order})`
        });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            if (error.fields && error.fields.includes('route_id_stop_id')) {
                throw new ConflictException("Cet arrêt est déjà lié à cette ligne.");
            }
            if (error.fields && error.fields.includes('route_id_stop_order')) {
                throw new ConflictException("Cet ordre est déjà utilisé sur cette ligne.");
            }
        }

        if (error.name === 'SequelizeForeignKeyConstraintError') {
            throw new NotFoundException("Route ou arrêt non trouvé. Vérifiez les IDs.");
        }

        next(error);
    }
};

exports.addSchedule = async (req, res, next) => {
    try {
        const { routeId, stopId } = req.params;
        const { arrivalTime, dayOfWeek } = req.body;

        if (!arrivalTime) {
            throw new ValidationException("L'heure d'arrivée (arrivalTime) est requise.");
        }

        if (dayOfWeek === undefined || dayOfWeek === null) {
            throw new ValidationException("Le jour de la semaine (dayOfWeek) est requis.");
        }

        if (dayOfWeek < 0 || dayOfWeek > 6) {
            throw new ValidationException("Le jour de la semaine doit être entre 0 (dimanche) et 6 (samedi).");
        }

        const routeStop = await db.RouteStop.findOne({
            where: { routeId: routeId, stopId: stopId }
        });

        if (!routeStop) {
            throw new NotFoundException("L'association de cet arrêt et cette ligne n'existe pas.");
        }

        const newSchedule = await db.Schedule.create({
            routeStopId: routeStop.id,
            arrivalTime: arrivalTime,
            dayOfWeek: dayOfWeek
        });

        res.status(201).json({
            success: true,
            data: newSchedule,
            message: "Horaire ajouté avec succès"
        });
    } catch (error) {
        next(error);
    }
};
exports.getAllStops = async (req, res, next) => {
    try {
        const stops = await db.Stop.findAll({ 
            order: [['name', 'ASC']] 
        });
        
        res.status(200).json({
            success: true,
            data: stops,
            count: stops.length
        });
    } catch (error) {
        next(error);
    }
};
exports.deleteSchedule = async (req, res, next) => {
    try {
        const { scheduleId } = req.params;

        const schedule = await db.Schedule.findByPk(scheduleId, {
            include: {
                model: db.RouteStop,
                include: [db.Route, db.Stop]
            }
        });

        if (!schedule) {
            throw new NotFoundException("Horaire non trouvé.");
        }

        const routeName = schedule.RouteStop.Route.name;
        const stopName = schedule.RouteStop.Stop.name;
        const arrivalTime = schedule.arrivalTime;
        const dayOfWeek = schedule.dayOfWeek;

        await schedule.destroy();

        const eventData = {
            tripId: scheduleId,
            routeName: routeName,
            stopName: stopName,
            scheduledTime: arrivalTime,
            dayOfWeek: dayOfWeek,
            reason: "Ce trajet a été annulé par un administrateur."
        };
        publishEvent('trip.canceled', eventData);

        res.status(200).json({
            success: true,
            message: "Horaire supprimé avec succès et notification d'annulation publiée."
        });
    } catch (error) {
        next(error);
    }
};
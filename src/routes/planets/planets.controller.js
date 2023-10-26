const { getAllPlantets } = require('../../models/planets.model');


async function httpgetAllPlanets(req, res) {
    return res.status(200).json(await getAllPlantets());
}


module.exports = {
    httpgetAllPlanets,
}
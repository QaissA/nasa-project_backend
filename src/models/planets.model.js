const { parse } = require('csv-parse')
const fs  = require('fs');
const path = require('path');

const planets = require('./planets.mongo')

// const results = [];

function filterPlanets(data) {
    return data['koi_disposition'] === "CONFIRMED" 
    && data['koi_insol'] > 0.36  && data['koi_insol'] < 1.11
    && data['koi_prad'] < 1.6;
}

function  loadPlanetsData() {
    return  new Promise((resolve, reject) => {
        fs.createReadStream(path.join(__dirname, '..', '..', 'data', 'kepler_data.csv'))
        .pipe(parse({
            comment : '#',
            columns : true
        }))
        .on('data', async (data) => {
        
            if(filterPlanets(data)) {
                // results.push(data)
                savePlanets(data);
            }
        })
        .on('error',(err) => {
            console.log(err);
            reject(err);
        })
        .on('end', async () => {
            const countPlanetsFound = (await getAllPlantets()).length;
            console.log(`${countPlanetsFound} is the amounts of habitable planet found !`);
            resolve();
        });
    
    });
    
}

async function getAllPlantets(){
    return await planets.find({}, {
        '__v' : 0,
        '_id' : 0
    });
}

async function savePlanets(planetData){
    try{
        await planets.updateOne({
            keplerName : planetData.kepler_name,
           }, {
            keplerName : planetData.kepler_name,
           }, {
            upsert : true,
           });     
    }catch(err){
        console.error(`we could not  save a planet. ${err}`);
    }

}


module.exports = {
    loadPlanetsData,
    getAllPlantets
}
const axios = require('axios');

const launchesDataBase = require('./launch.mongo');
const planets = require('./planets.mongo');

const DEFAULT_FLIGHT_NUMBER = 100;

const launches = new Map();


// const launch = {
//     flightNumber : 100,
//     mission : 'test11',
//     rocket : 'test',
//     launchDate : new Date(Date.now()),
//     destination : 'Kepler-1652 b',
//     customers : [
//         'NASA',
//         'ZeroToMastery'
//     ],
//     upcoming : true,
//     success : true
// }


// saveLaunch(launch);

const SPACEX_API_URL = "https://api.spacexdata.com/v5/launches/query";

async function populateLaunches(){
    console.log("Data has been already loaded....")
    const response = await axios.post(SPACEX_API_URL, 
        {
            query : {},
            options : {
                pagination : false,
                populate : [
                    {
                        path : 'rocket',
                        select : {
                            name : 1
                        }
                    },
                    {
                        path : 'payloads',
                        select : {
                            customers : 1
                        }
                    },

                ]
            }
        });
    
    const launchDocs = response.data.docs;
    for(const launchDoc of launchDocs) {
        const payloads = launchDoc['payloads'];
        const customers = payloads.flatMap((payload) => {
            return payload['customers'];
        })

        const launch = {
            flightNumber : launchDoc['flight_number'],
            mission : launchDoc['name'],
            rocket : launchDoc['rocket']['name'],
            launchDate : launchDoc['date_local'],
            upcoming : launchDoc['upcoming'],
            succes : launchDoc['success'],
            customers : customers
        };

        console.log(`${launch.flightNumber}, ${launch.mission}`);
        await saveLaunch(launch);
    }

    if(response.status !== 200) {
        console.log("problem downloading data ...")
        throw new Error('launch data download failed');
    }
}

async function loadLaunchData(){
    const firstLaunch = await findLaunch({
        flightNumber : 1,
        rocket : "Falcon 1",
        mission : "FalconSat"
    });

    if(firstLaunch) {
        console.log('launch data was already loaded');
    } else{
        await populateLaunches(); 
    }

}

async function findLaunch(filter){
    return await launchesDataBase.findOne(filter);
}

// launches.set(launch.flightNumber, launch);

async function existLaunchWithId(launchId) {
    return await findLaunch({
        flightNumber : launchId,
    });
}

async function getLastestFlightNumber(){
    const latestLaunch = await launchesDataBase.findOne().sort('-flightNumber');

    if(!latestLaunch){
        return DEFAULT_FLIGHT_NUMBER;
    }

    return latestLaunch.flightNumber;
}

async function getAllLaunches(skip, limit){    
    return await launchesDataBase
        .find({}, {
        '_id' : 0,
        '__v' : 0
        })
        .sort({flightNumber : 1})
        .skip(skip)
        .limit(limit)
}

async function saveLaunch(launch) { 
 
     await launchesDataBase.findOneAndUpdate({
        flightNumber : launch.flightNumber
     }, 
     launch,
     {
        upsert : true
     });
}

 async function scheduleNewLaunch(launch) {
    const planet = await planets.findOne({
        keplerName : launch.destination,
    });

    if(!planet) {
        throw new Error('no matching planet was found !');
    }

    const newFlightNumber = await getLastestFlightNumber() + 1;

    const newLaunch = Object.assign(launch, {
        success : true,
        upcoming : true,
        customers : ['ZTM', 'NASA'],
        flightNumber : newFlightNumber,
    });

    await saveLaunch(newLaunch);
}


async function DeleteLaunchById(launchId){
    const deletedLaunch =  await launchesDataBase.updateOne({
        flightNumber : launchId,
    },
    {
        upcoming : false,
        success : false,
    })

    return deletedLaunch.acknowledged === true && deletedLaunch.modifiedCount === 1
}

module.exports = {
    loadLaunchData,
    existLaunchWithId,
    getAllLaunches,
    scheduleNewLaunch,
    DeleteLaunchById
}
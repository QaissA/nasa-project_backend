const request = require('supertest');
const app = require('../../app');

const {mongoConnect, mongoDisconnect} = require('../../services/mongo');
const { loadPlanetsData } = require('../../models/planets.model');

describe('launches API', () => {
    beforeAll(async ()=> {
        await mongoConnect();
        await loadPlanetsData();
    });

    afterAll( async () => {
        await mongoDisconnect();
    })


    describe("Test GET /launches", () => {
        test('it should respond with 200 success', async ()=> {
            const response = await request(app)
            .get('/v1/launches')
            .expect('content-Type', /json/)
            .expect(200);
        });
    });

    describe("Test POST /launches", () => {
        const completeLaunchData = {
            mission: 'test mission',
            rocket : 'test rocket',
            destination : 'Kepler-1652 b',
            launchDate : 'June 24, 2030'
        };
    
        const launchDataWithoutDate = {
            mission: 'test mission',
            rocket : 'test rocket',
            destination : 'Kepler-1652 b',
        };
    
        const DataWithDateWrong = {
            mission: 'test mission',
            rocket : 'test rocket',
            destination : 'Kepler-1652 b',
            launchDate : 'hello'
        };
        const DataWithEmptyProp = {
            mission: 'test mission',
            rocket : 'test rocket',
            destination : '',
            launchDate : 'June 24, 2030'
        };
    
    
    
        test('it should respond with 201 created', async () =>{
            const response = await request(app)
            .post('/v1/launches')
            .send(completeLaunchData)
            .expect('content-Type', /json/)
            expect(201);
    
        const requestDate = new Date(completeLaunchData.launchDate).valueOf();
        const responseDate = new Date(response.body.launchDate).valueOf();
    
        expect(responseDate).toBe(requestDate);
    
        expect(response.body).toMatchObject(launchDataWithoutDate);
        });
    
        test('it should catch missing required properties', async () => {
            const response = await request(app)
                .post('/v1/launches')
                .send(DataWithEmptyProp)
                .expect('content-Type', /json/)
                expect(400);
    
            expect(response.body).toStrictEqual({
                error : 'Missing required launch property'
            })
    
        })
        test('it should catch invalid dates', async () => {
            const response = await request(app)
                .post('/v1/launches')
                .send(DataWithDateWrong)
                .expect('content-Type', /json/)
                expect(400);
    
            expect(response.body).toStrictEqual({
                error : 'launch Date property invalid !',
            })
    
        })
    });
    
})




import express, { Express, NextFunction, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';

dotenv.config();
let clients: { id: number, response: Response }[] = [];
let facts: string[] = [];

const app: Express = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/status', (request, response) => response.json({ clients: clients.length }));

const PORT = 3000;



app.get('/', (req: Request, res: Response) => {
    res.send('Express + TypeScript Server');
});

app.listen(PORT, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
});

function eventsHandler(request: Request, response: Response, next: NextFunction) {
    console.log('eventsHandler')
    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };
    response.writeHead(200, headers);

    facts.push('test');
    const data = `data: ${JSON.stringify(facts)}\n\n`;
    console.log(data)

    response.write(data);

    console.log('after data')
    const clientId = Date.now();

    const newClient = {
        id: clientId,
        response
    };

    clients.push(newClient);

    console.log('ended')
    request.on('close', () => {
        console.log(`${clientId} Connection closed`);
        clients = clients.filter(client => client.id !== clientId);
    });
}

app.get('/events', eventsHandler);

function sendEventsToAll(newFact: string) {
    clients.forEach(client => {
        client.response.write(`data: ${JSON.stringify(newFact)}\n\n`);
        client.response.end();
    })

}

async function addFact(request: Request, respsonse: Response, next: NextFunction) {
    console.log(request.body)
    const newFact = request.body;
    facts.push(newFact);
    respsonse.json(newFact)
    return sendEventsToAll(newFact);
}

app.post('/fact', addFact);
const fs = require('fs');
const http = require('http');
const path = require('path');
const mime = require('mime-types');
const os = require('os');
const { exec } = require('child_process');
const WebSocket = require('ws');
const chokidar = require('chokidar');
const sse = require('sse-stream');
const readline = require('readline');


console.log("----------------------------------------------------");
console.log("Slate server 1.2");
console.log("Developed by Tristan @ Thoq Industries");
console.log("Node.js Version: " + process.version);
exec('npm -v', (error, stdout, stderr) => {
    if (error) {
        console.error(`exec error: ${error}`);
        return;
    }
});
console.log("CPU: " + os.cpus()[0].model);
console.log("RAM: " + Math.round(os.totalmem() / 1024 / 1024) + " MB");
console.log("----------------------------------------------------");
console.log(" ");

function readConfig() {
    const configContent = fs.readFileSync('server.conf.slate', 'utf8');
    const lines = configContent.split('\n');
    const config = {};

    lines.forEach(line => {
        if (!line.includes('=')) return;
        const parts = line.split('|').map(part => part.trim());
        parts.forEach(part => {
            const match = part.match(/(\w+)=(.+)/);
            if (match) {
                const key = match[1];
                const value = match[2].replace(/[\(\)'"]/g, '');
                config[key] = value;
            }
        });
    });

    return config;
}

const config = readConfig();

let clients = [];

function startServer() {
    const server = http.createServer((req, res) => {
        if (req.url === '/sse') {
            const sseStream = sse(req, res);
            clients.push(sseStream);

            req.on('close', () => {
                clients = clients.filter(client => client !== sseStream);
            });

            return;
        }

        let filePath = '';
        if (req.url === '/') {
            filePath = path.join(__dirname, 'index.html');
        } else {
            filePath = path.join(__dirname, config.SRC, req.url);
        }

        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end(JSON.stringify(err));
                return;
            }

            if (req.url === '/') {
                const templatePath = path.join(__dirname, config.SRC, config.TEMPLATE);
                fs.readFile(templatePath, 'utf8', (err, templateData) => {
                    if (err) {
                        res.writeHead(404);
                        res.end(JSON.stringify(err));
                        return;
                    }
                    const content = data.replace('<!-- CONTENT -->', templateData);
                    res.setHeader('Content-Type', 'text/html');
                    res.end(content);
                });
            } else {
                const mimeType = mime.lookup(filePath);
                res.setHeader('Content-Type', mimeType || 'application/octet-stream');
                res.end(data);
            }
        });
    });

    const watcher = chokidar.watch('./', {
        ignored: /(^|[\/\\])\../,
        persistent: true,
        depth: 99, 
    });

    watcher.on('change', (path) => {
        console.log(`File ${path} has been changed`);
        clients.forEach(client => {
            client.send('reload');
        });
    });

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.on('line', (input) => {
        if (input.toUpperCase() === 'R') {
            console.log('Reload command received. Sending reload to all clients...');
    
            clients.forEach(client => {
                if (typeof client.send === 'function') {
                    client.send('data: reload\n\n');
                }
            });
    
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send('reload');
                }
            });
        }
    });    

    function getInternalIP() {
        const networkInterfaces = os.networkInterfaces();
        let internalIP = 'unknown';

        for (const name of Object.keys(networkInterfaces)) {
            for (const netInfo of networkInterfaces[name]) {
                if (netInfo.family === 'IPv4' && !netInfo.internal) {
                    internalIP = netInfo.address;
                    break;
                }
            }
        }

        return internalIP;
    }

    server.listen(config.PORT, () => {
        console.log('[Slate] → Server Running...');
        console.log(`[Slate] → Local server running at http://localhost:${config.PORT}/`);
        console.log(`[Slate] → Network server running at http://${getInternalIP()}:${config.PORT}/`);
    });

    const wss = new WebSocket.Server({ noServer: true });

    wss.on('connection', (ws) => {
        console.log('Client connected');

        ws.on('close', () => {
            console.log('Client disconnected');
        });
    });

    server.on('upgrade', (request, socket, head) => {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    });
}

module.exports = { startServer };

startServer();